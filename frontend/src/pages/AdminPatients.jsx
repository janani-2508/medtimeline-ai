import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    api.get('/admin/patients').then(res => setPatients(res.data));
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>All Patients</h1>
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
          </tbody>
        </table>
      </main>
    </div>
  );
}
