import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

const SAMPLE_QUESTIONS = [
  "What is the latest diagnosis?",
  "What medications were prescribed?",
  "What were the recent lab results?",
  "When was the last consultation?"
];

export default function AIAssistant() {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(searchParams.get('patient_id') || '');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/patients').then(res => setPatients(res.data));
  }, []);

  async function ask(q) {
    const text = q || question;
    if (!text || !patientId) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setQuestion('');
    setBusy(true);
    try {
      const res = await api.post('/assistant/ask', { patient_id: patientId, question: text });
      setMessages(m => [...m, { role: 'assistant', text: res.data.answer }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong answering that question.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>AI Patient Assistant</h1>
        <select className="search-input" value={patientId} onChange={e => { setPatientId(e.target.value); setMessages([]); }}>
          <option value="">Select a patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>)}
        </select>

        {patientId && (
          <div className="chip-row">
            {SAMPLE_QUESTIONS.map(q => (
              <button key={q} className="chip" onClick={() => ask(q)} disabled={busy}>{q}</button>
            ))}
          </div>
        )}

        <div className="chat-window">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
          ))}
          {busy && <div className="chat-bubble assistant">Thinking...</div>}
        </div>

        <form className="chat-input-row" onSubmit={e => { e.preventDefault(); ask(); }}>
          <input
            placeholder="Ask about this patient's records..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={!patientId || busy}
          />
          <button className="btn-primary" type="submit" disabled={!patientId || busy}>Ask</button>
        </form>
      </main>
    </div>
  );
}
