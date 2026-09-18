import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  function load(q) {
    api.get('/admin/users', { params: q ? { search: q } : {} }).then(res => setUsers(res.data));
  }

  useEffect(() => { load(''); }, []);

  async function toggleActive(user) {
    await api.patch(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
    load(search);
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>User Management</h1>
        <input className="search-input" placeholder="Search users..." value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }} />
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Active' : 'Deactivated'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="btn-link" onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
