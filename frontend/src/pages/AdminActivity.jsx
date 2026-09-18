import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get('/admin/activity').then(res => setActivity(res.data));
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>System Activity</h1>
        <table className="data-table">
          <thead><tr><th>Action</th><th>User</th><th>Entity</th><th>When</th></tr></thead>
          <tbody>
            {activity.map(a => (
              <tr key={a.id}>
                <td>{a.action}</td>
                <td>{a.profiles?.name || a.profiles?.email || '-'}</td>
                <td>{a.entity_type || '-'}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {activity.length === 0 && <tr><td colSpan="4">No activity yet.</td></tr>}
          </tbody>
        </table>
      </main>
    </div>
  );
}
