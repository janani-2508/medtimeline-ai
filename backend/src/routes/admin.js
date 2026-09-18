import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats - dashboard summary cards
router.get('/stats', async (req, res) => {
  try {
    const [{ count: totalUsers }, { count: totalPatients }, { count: totalDocuments },
      { count: completedDocs }, { count: processingDocs }, { count: failedDocs }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('patients').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }).eq('processing_status', 'completed'),
      supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }).eq('processing_status', 'processing'),
      supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }).eq('processing_status', 'failed')
    ]);

    res.json({ totalUsers, totalPatients, totalDocuments, completedDocs, processingDocs, failedDocs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users?search=
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/status  { is_active: boolean }
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/patients - all patients, any owner
router.get('/patients', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('patients').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/documents?status= - all documents, any owner
router.get('/documents', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin.from('documents').select('*, patients:patient_id(name, patient_id)').order('created_at', { ascending: false });
    if (status) query = query.eq('processing_status', status);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/activity - recent system activity
router.get('/activity', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*, profiles:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
