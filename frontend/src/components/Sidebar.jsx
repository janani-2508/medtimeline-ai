import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/documents', label: 'Documents' },
  { to: '/assistant', label: 'AI Assistant' }
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/patients', label: 'Patients' },
  { to: '/admin/documents', label: 'Documents' },
  { to: '/admin/activity', label: 'Activity' }
];

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const links = profile?.role === 'admin' ? ADMIN_LINKS : USER_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">MedTimeline AI</div>
      <nav>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">{profile?.name || profile?.email}</div>
        <button className="btn-secondary" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
