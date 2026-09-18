import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

const STAGES = ['uploaded', 'processing', 'completed'];

export default function DocumentUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(searchParams.get('patient_id') || '');
  const [documentType, setDocumentType] = useState('Consultation Report');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | uploading | processing | completed | failed
  const [error, setError] = useState('');
  const [resultDoc, setResultDoc] = useState(null);

  useEffect(() => {
    api.get('/patients').then(res => setPatients(res.data));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    if (!file || !patientId) {
      setError('Please select a patient and a file');
      return;
    }
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('document_type', documentType);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultDoc(res.data.document);
      setStatus('processing');
      pollStatus(res.data.document.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setStatus('failed');
    }
  }

  function pollStatus(docId) {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/documents/${docId}`);
        const doc = res.data.document;
        setResultDoc(doc);
        if (doc.processing_status === 'completed' || doc.processing_status === 'failed') {
          setStatus(doc.processing_status);
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2500);
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>Upload Medical Document</h1>
        <form className="form-card" onSubmit={handleUpload}>
          {error && <div className="error-box">{error}</div>}
          <label>Patient</label>
          <select value={patientId} onChange={e => setPatientId(e.target.value)} required>
            <option value="">Select a patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>)}
          </select>
          <label>Document Type</label>
          <select value={documentType} onChange={e => setDocumentType(e.target.value)}>
            <option>Consultation Report</option>
            <option>Blood Test Report</option>
            <option>Prescription</option>
            <option>Follow-up Report</option>
            <option>Other</option>
          </select>
          <label>File (PDF, JPG, JPEG, PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} required />
          <button className="btn-primary" type="submit" disabled={status === 'uploading' || status === 'processing'}>
            {status === 'uploading' ? 'Uploading...' : 'Upload & Process'}
          </button>
        </form>

        {status && (
          <div className="processing-card">
            <h3>Processing Status</h3>
            <div className="stage-track">
              {STAGES.map(stage => (
                <div key={stage} className={`stage ${status === stage || (status === 'completed' && STAGES.indexOf(stage) <= 2) ? 'stage-active' : ''}`}>
                  {stage}
                </div>
              ))}
            </div>
            {status === 'failed' && <div className="error-box">Processing failed: {resultDoc?.error_message || 'Unknown error'}. You can retry from Document History.</div>}
            {status === 'completed' && (
              <button className="btn-primary" onClick={() => navigate(`/documents/${resultDoc.id}`)}>
                View Extracted Information
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
