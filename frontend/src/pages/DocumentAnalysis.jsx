import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import api from '../api';

function ListSection({ title, items }) {
  return (
    <div className="analysis-section">
      <h4>{title}</h4>
      {(!items || items.length === 0) ? <p className="muted">None recorded</p> : (
        <ul>{items.map((item, i) => <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul>
      )}
    </div>
  );
}

export default function DocumentAnalysis() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/documents/${id}`).then(res => {
      setDoc(res.data.document);
      setRecord(res.data.medical_record);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="layout"><Sidebar /><main className="content"><p>Loading...</p></main></div>;
  if (!doc) return <div className="layout"><Sidebar /><main className="content"><p>Document not found.</p></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <div className="row-between">
          <h1>{doc.file_name}</h1>
          <StatusBadge status={doc.processing_status} />
        </div>
        <p className="muted">Type: {doc.document_type} · Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
        <a className="btn-secondary" href={doc.file_url} target="_blank" rel="noreferrer">View Original Document</a>

        {!record ? (
          <p className="muted" style={{ marginTop: '1rem' }}>No extracted data available yet.</p>
        ) : (
          <div className="analysis-grid">
            <ListSection title="Diagnosis" items={record.diagnosis} />
            <ListSection title="Symptoms" items={record.symptoms} />
            <ListSection title="Medications" items={record.medications} />
            <ListSection title="Lab Results" items={record.lab_results} />
            <ListSection title="Procedures" items={record.procedures} />
            <ListSection title="Allergies" items={record.allergies} />
          </div>
        )}
      </main>
    </div>
  );
}
