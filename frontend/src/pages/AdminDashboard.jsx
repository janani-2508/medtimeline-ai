import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
    api.get('/admin/activity').then(res => setActivity(res.data.slice(0, 8)));
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>Admin Dashboard</h1>
        {stats && (
          <div className="cards-grid">
            <div className="stat-card"><span>{stats.totalUsers}</span><label>Total Users</label></div>
            <div className="stat-card"><span>{stats.totalPatients}</span><label>Total Patients</label></div>
            <div className="stat-card"><span>{stats.totalDocuments}</span><label>Total Documents</label></div>
            <div className="stat-card"><span>{stats.completedDocs}</span><label>Processed</label></div>
            <div className="stat-card"><span>{stats.processingDocs}</span><label>Processing</label></div>
            <div className="stat-card"><span>{stats.failedDocs}</span><label>Failed</label></div>
          </div>
        )}

        <h2>Recent System Activity</h2>
        <table className="data-table">
          <thead><tr><th>Action</th><th>User</th><th>When</th></tr></thead>
          <tbody>
            {activity.map(a => (
              <tr key={a.id}>
                <td>{a.action}</td>
                <td>{a.profiles?.name || a.profiles?.email || '-'}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {activity.length === 0 && <tr><td colSpan="3">No activity yet.</td></tr>}
          </tbody>
        </table>
      </main>
    </div>
  );
}
