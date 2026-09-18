import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AddPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ patient_id: '', name: '', date_of_birth: '', gender: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/patients', form);
      navigate(`/patients/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add patient');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>Add Patient</h1>
        <form className="form-card" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <label>Patient ID</label>
          <input value={form.patient_id} onChange={e => update('patient_id', e.target.value)} required />
          <label>Name</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} required />
          <label>Date of Birth</label>
          <input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          <label>Gender</label>
          <select value={form.gender} onChange={e => update('gender', e.target.value)}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Save Patient'}
          </button>
        </form>
      </main>
    </div>
  );
}
