import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="auth-subtitle">New accounts are always registered as standard users</p>
        {error && <div className="error-box">{error}</div>}
        <label>Name</label>
        <input value={form.name} onChange={e => update('name', e.target.value)} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
        <label>Password</label>
        <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required />
        <label>Confirm Password</label>
        <input type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Register'}
        </button>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
