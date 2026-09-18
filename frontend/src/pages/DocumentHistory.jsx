import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import api from '../api';

export default function DocumentHistory() {
  const [documents, setDocuments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/documents', { params: statusFilter ? { status: statusFilter } : {} })
      .then(res => setDocuments(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function retry(docId) {
    await api.post(`/documents/${docId}/retry`);
    load();
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <div className="row-between">
          <h1>Document History</h1>
          <Link className="btn-primary" to="/documents">+ Upload New</Link>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="search-input">
          <option value="">All statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        {loading ? <p>Loading...</p> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Uploaded</th><th>Medical Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id}>
                  <td>{d.file_name}</td>
                  <td>{d.document_type}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>{d.document_date || '-'}</td>
                  <td><StatusBadge status={d.processing_status} /></td>
                  <td>
                    <Link to={`/documents/${d.id}`}>View</Link>
                    {d.processing_status === 'failed' && <button className="btn-link" onClick={() => retry(d.id)}>Retry</button>}
                  </td>
                </tr>
              ))}
              {documents.length === 0 && <tr><td colSpan="6">No documents found.</td></tr>}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
