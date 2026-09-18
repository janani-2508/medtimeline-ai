import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import api from '../api';

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/timeline/${id}`),
      api.get('/documents', { params: { patient_id: id } })
    ]).then(([p, t, d]) => {
      setPatient(p.data);
      setTimeline(t.data);
      setDocuments(d.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="layout"><Sidebar /><main className="content"><p>Loading...</p></main></div>;
  if (!patient) return <div className="layout"><Sidebar /><main className="content"><p>Patient not found.</p></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <div className="row-between">
          <div>
            <h1>{patient.name}</h1>
            <p className="muted">ID: {patient.patient_id} · DOB: {patient.date_of_birth || '-'} · Gender: {patient.gender || '-'}</p>
          </div>
          <div className="btn-group">
            <Link className="btn-primary" to={`/documents?patient_id=${id}`}>Upload Document</Link>
            <Link className="btn-secondary" to={`/assistant?patient_id=${id}`}>Ask AI Assistant</Link>
          </div>
        </div>

        <h2>Medical Timeline</h2>
        <div className="timeline">
          {timeline.length === 0 && <p className="muted">No timeline events yet. Upload a document to get started.</p>}
          {timeline.map(evt => (
            <div key={evt.id} className="timeline-item">
              <div className="timeline-date">{evt.event_date}</div>
              <div className="timeline-body">
                <div className="timeline-type">{evt.event_type}</div>
                <div className="timeline-title">{evt.title}</div>
                <p>{evt.description}</p>
                {evt.documents && (
                  <a href={evt.documents.file_url} target="_blank" rel="noreferrer" className="source-link">
                    View source document: {evt.documents.file_name}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2>Documents</h2>
        <table className="data-table">
          <thead><tr><th>File</th><th>Type</th><th>Status</th><th>Uploaded</th><th></th></tr></thead>
          <tbody>
            {documents.map(d => (
              <tr key={d.id}>
                <td>{d.file_name}</td>
                <td>{d.document_type}</td>
                <td><StatusBadge status={d.processing_status} /></td>
                <td>{new Date(d.created_at).toLocaleDateString()}</td>
                <td><a href={d.file_url} target="_blank" rel="noreferrer">View</a></td>
              </tr>
            ))}
            {documents.length === 0 && <tr><td colSpan="5">No documents uploaded yet.</td></tr>}
          </tbody>
        </table>
      </main>
    </div>
  );
}
