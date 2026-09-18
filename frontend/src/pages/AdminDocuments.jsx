import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import api from '../api';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/admin/documents', { params: statusFilter ? { status: statusFilter } : {} })
      .then(res => setDocuments(res.data));
  }, [statusFilter]);

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>All Documents</h1>
        <select className="search-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <table className="data-table">
          <thead><tr><th>File</th><th>Patient</th><th>Type</th><th>Status</th><th>Uploaded</th><th></th></tr></thead>
          <tbody>
            {documents.map(d => (
              <tr key={d.id}>
                <td>{d.file_name}</td>
                <td>{d.patients?.name} ({d.patients?.patient_id})</td>
                <td>{d.document_type}</td>
                <td><StatusBadge status={d.processing_status} /></td>
                <td>{new Date(d.created_at).toLocaleDateString()}</td>
                <td><Link to={`/documents/${d.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
