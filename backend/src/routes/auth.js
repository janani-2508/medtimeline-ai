import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// POST /api/auth/register
// Public. Always creates a `user` role account (never admin).
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (error) return res.status(400).json({ error: error.message });

    // profile row + role='user' is created automatically by the
    // handle_new_user() trigger defined in database/schema.sql
    res.status(201).json({ message: 'Registered successfully', user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
// Returns the current profile (role, etc.) for a given access token.
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    res.json({ user: userData.user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NOTE: actual login/logout is handled client-side via the Supabase JS SDK
// (supabase.auth.signInWithPassword / signOut) — the frontend then attaches
// the resulting access_token as a Bearer token to every backend request.

export default router;
