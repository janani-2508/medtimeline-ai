import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function UserDashboard() {
  const [patients, setPatients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/documents')])
      .then(([p, d]) => { setPatients(p.data); setDocuments(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const completed = documents.filter(d => d.processing_status === 'completed').length;

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>Dashboard</h1>
        <div className="cards-grid">
          <div className="stat-card"><span>{patients.length}</span><label>Total Patients</label></div>
          <div className="stat-card"><span>{documents.length}</span><label>Total Documents</label></div>
          <div className="stat-card"><span>{completed}</span><label>Processed Documents</label></div>
        </div>

        <div className="row-between">
          <h2>Recent Patients</h2>
          <Link className="btn-primary" to="/documents">Quick Upload</Link>
        </div>
        {loading ? <p>Loading...</p> : (
          <table className="data-table">
            <thead><tr><th>Patient ID</th><th>Name</th><th>DOB</th><th>Gender</th></tr></thead>
            <tbody>
              {patients.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td><Link to={`/patients/${p.id}`}>{p.patient_id}</Link></td>
                  <td>{p.name}</td>
                  <td>{p.date_of_birth || '-'}</td>
                  <td>{p.gender || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
