import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(q) {
    setLoading(true);
    api.get('/patients', { params: q ? { search: q } : {} })
      .then(res => setPatients(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(''); }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <div className="row-between">
          <h1>Patients</h1>
          <Link className="btn-primary" to="/patients/new">+ Add Patient</Link>
        </div>
        <input
          className="search-input"
          placeholder="Search by name or patient ID..."
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
        />
        {loading ? <p>Loading...</p> : (
          <table className="data-table">
            <thead><tr><th>Patient ID</th><th>Name</th><th>DOB</th><th>Gender</th><th>Added</th></tr></thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td><Link to={`/patients/${p.id}`}>{p.patient_id}</Link></td>
                  <td>{p.name}</td>
                  <td>{p.date_of_birth || '-'}</td>
                  <td>{p.gender || '-'}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {patients.length === 0 && <tr><td colSpan="5">No patients found.</td></tr>}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
