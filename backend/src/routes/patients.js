import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// POST /api/patients - create a patient (scoped to the logged-in user)
router.post('/', async (req, res) => {
  try {
    const { patient_id, name, date_of_birth, gender } = req.body;
    if (!patient_id || !name) {
      return res.status(400).json({ error: 'patient_id and name are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert({ patient_id, name, date_of_birth, gender, created_by: req.profile.id })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.profile.id, action: 'patient_created', entity_type: 'patient', entity_id: data.id
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients?search= - list patients for this user (or all, if admin)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabaseAdmin.from('patients').select('*').order('created_at', { ascending: false });

    if (req.profile.role !== 'admin') {
      query = query.eq('created_by', req.profile.id);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,patient_id.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id - single patient
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && data.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized to view this patient' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/patients/:id - update patient
router.put('/:id', async (req, res) => {
  try {
    const { name, date_of_birth, gender } = req.body;
    const { data: existing } = await supabaseAdmin.from('patients').select('created_by').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Patient not found' });
    if (req.profile.role !== 'admin' && existing.created_by !== req.profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update({ name, date_of_birth, gender })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
