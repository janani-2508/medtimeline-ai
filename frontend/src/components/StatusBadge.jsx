const COLORS = {
  uploaded: '#64748b',
  processing: '#d97706',
  completed: '#16a34a',
  failed: '#dc2626'
};

export default function StatusBadge({ status }) {
  return (
    <span className="status-badge" style={{ backgroundColor: COLORS[status] || '#64748b' }}>
      {status}
    </span>
  );
}
