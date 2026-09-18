import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/records/:patientId - all extracted medical records for a patient
router.get('/:patientId', async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin.from('patients').select('created_by').eq('id', req.params.patientId).single();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && patient.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabaseAdmin
      .from('medical_records')
      .select('*, documents:document_id(file_name, file_url, document_type, document_date)')
      .eq('patient_id', req.params.patientId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
