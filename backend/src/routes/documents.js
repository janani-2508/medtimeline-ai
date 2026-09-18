import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { extractMedicalData } from '../services/geminiExtraction.js';
import { generateTimelineEvents } from '../services/timelineGenerator.js';

const router = express.Router();
router.use(requireAuth);

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed'));
    }
    cb(null, true);
  }
});

// POST /api/documents/upload  (multipart/form-data: file, patient_id, document_type)
router.post('/upload', upload.single('file'), async (req, res) => {
  let documentRow = null;
  try {
    const { patient_id, document_type } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    // Verify patient ownership
    const { data: patient } = await supabaseAdmin.from('patients').select('*').eq('id', patient_id).single();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && patient.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized for this patient' });
    }

    // 1. Upload to Supabase Storage
    const bucket = process.env.STORAGE_BUCKET || 'medical-documents';
    const filePath = `${patient_id}/${Date.now()}_${req.file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) return res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    // 2. Create document row (status: uploaded -> processing)
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        patient_id,
        file_name: req.file.originalname,
        file_url: urlData.publicUrl,
        document_type: document_type || 'Unknown',
        processing_status: 'processing',
        created_by: req.profile.id
      })
      .select()
      .single();

    if (docError) return res.status(500).json({ error: docError.message });
    documentRow = doc;

    // Respond immediately with the document + status "processing";
    // the frontend polls GET /api/documents/:id for status updates.
    res.status(202).json({ document: doc, message: 'Upload received, processing started' });

    // 3. Kick off AI extraction (fire-and-forget after response sent)
    processDocumentAsync(doc, req.file.buffer, req.file.mimetype, req.profile.id);
  } catch (err) {
    if (documentRow) {
      await supabaseAdmin.from('documents').update({ processing_status: 'failed', error_message: err.message }).eq('id', documentRow.id);
    }
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

async function processDocumentAsync(doc, fileBuffer, mimeType, userId) {
  try {
    const result = await extractMedicalData(fileBuffer, mimeType);

    if (!result.success) {
      await supabaseAdmin.from('documents')
        .update({ processing_status: 'failed', error_message: (result.errors || []).join('; ') })
        .eq('id', doc.id);
      return;
    }

    const extracted = result.data;

    // Save structured medical record
    const { data: record, error: recError } = await supabaseAdmin
      .from('medical_records')
      .insert({
        document_id: doc.id,
        patient_id: doc.patient_id,
        diagnosis: extracted.clinical_data.diagnoses || [],
        symptoms: extracted.clinical_data.symptoms || [],
        medications: extracted.clinical_data.medications || [],
        lab_results: extracted.clinical_data.lab_results || [],
        procedures: extracted.clinical_data.procedures || [],
        allergies: extracted.clinical_data.allergies || [],
        raw_extraction: extracted
      })
      .select()
      .single();

    if (recError) throw recError;

    // Generate timeline events from extraction
    await generateTimelineEvents({
      patientId: doc.patient_id,
      documentId: doc.id,
      timelineEvents: extracted.timeline_events || [],
      documentDate: extracted.document?.document_date
    });

    await supabaseAdmin.from('documents')
      .update({
        processing_status: 'completed',
        document_date: extracted.document?.document_date || null
      })
      .eq('id', doc.id);

    await supabaseAdmin.from('activity_logs').insert({
      user_id: userId, action: 'document_processed', entity_type: 'document', entity_id: doc.id
    });
  } catch (err) {
    console.error('Async processing failed:', err.message);
    await supabaseAdmin.from('documents')
      .update({ processing_status: 'failed', error_message: err.message })
      .eq('id', doc.id);
  }
}

// GET /api/documents?patient_id=&status= - list documents
router.get('/', async (req, res) => {
  try {
    const { patient_id, status } = req.query;
    let query = supabaseAdmin.from('documents').select('*').order('created_at', { ascending: false });

    if (req.profile.role !== 'admin') query = query.eq('created_by', req.profile.id);
    if (patient_id) query = query.eq('patient_id', patient_id);
    if (status) query = query.eq('processing_status', status);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id - single document + its extracted medical record
router.get('/:id', async (req, res) => {
  try {
    const { data: doc, error } = await supabaseAdmin.from('documents').select('*').eq('id', req.params.id).single();
    if (error || !doc) return res.status(404).json({ error: 'Document not found' });
    if (req.profile.role !== 'admin' && doc.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: record } = await supabaseAdmin.from('medical_records').select('*').eq('document_id', doc.id).maybeSingle();
    res.json({ document: doc, medical_record: record || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/:id/retry - retry failed processing
router.post('/:id/retry', async (req, res) => {
  try {
    const { data: doc, error } = await supabaseAdmin.from('documents').select('*').eq('id', req.params.id).single();
    if (error || !doc) return res.status(404).json({ error: 'Document not found' });
    if (req.profile.role !== 'admin' && doc.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (doc.retry_count >= 2) {
      return res.status(400).json({ error: 'Maximum retry attempts reached' });
    }

    await supabaseAdmin.from('documents')
      .update({ processing_status: 'processing', retry_count: doc.retry_count + 1, error_message: null })
      .eq('id', doc.id);

    // Re-download the file from storage to retry extraction
    const bucket = process.env.STORAGE_BUCKET || 'medical-documents';
    const filePath = doc.file_url.split(`${bucket}/`)[1];
    const { data: fileData, error: dlError } = await supabaseAdmin.storage.from(bucket).download(filePath);
    if (dlError) return res.status(500).json({ error: 'Could not re-download file for retry' });

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = fileData.type || 'application/pdf';

    res.json({ message: 'Retry started' });
    processDocumentAsync(doc, buffer, mimeType, req.profile.id);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
