import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/timeline/:patientId - chronological timeline for a patient
router.get('/:patientId', async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin.from('patients').select('created_by').eq('id', req.params.patientId).single();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && patient.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { event_type, date_from, date_to } = req.query;
    let query = supabaseAdmin
      .from('timeline_events')
      .select('*, documents:source_document_id(id, file_name, file_url, document_type)')
      .eq('patient_id', req.params.patientId)
      .order('event_date', { ascending: true });

    if (event_type) query = query.eq('event_type', event_type);
    if (date_from) query = query.gte('event_date', date_from);
    if (date_to) query = query.lte('event_date', date_to);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
