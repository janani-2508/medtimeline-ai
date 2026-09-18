import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { assistantModel } from '../config/gemini.js';
import { buildAssistantPrompt } from '../prompts/assistantPrompt.js';

const router = express.Router();
router.use(requireAuth);

// POST /api/assistant/ask  { patient_id, question }
router.post('/ask', async (req, res) => {
  try {
    const { patient_id, question } = req.body;
    if (!patient_id || !question) {
      return res.status(400).json({ error: 'patient_id and question are required' });
    }

    const { data: patient } = await supabaseAdmin.from('patients').select('*').eq('id', patient_id).single();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && patient.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Build a compact context: recent timeline events + medical records only
    // (not the entire raw extraction history) to keep the prompt small & relevant.
    const { data: timeline } = await supabaseAdmin
      .from('timeline_events')
      .select('event_date, event_type, title, description')
      .eq('patient_id', patient_id)
      .order('event_date', { ascending: false })
      .limit(30);

    const { data: records } = await supabaseAdmin
      .from('medical_records')
      .select('diagnosis, symptoms, medications, lab_results, procedures, allergies, created_at')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const patientContext = {
      patient: { name: patient.name, patient_id: patient.patient_id, date_of_birth: patient.date_of_birth, gender: patient.gender },
      timeline,
      medical_records: records
    };

    const prompt = buildAssistantPrompt(patientContext, question);
    const result = await assistantModel.generateContent(prompt);
    const answer = result.response.text();

    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.profile.id, action: 'ai_assistant_query', entity_type: 'patient', entity_id: patient_id
    });

    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
