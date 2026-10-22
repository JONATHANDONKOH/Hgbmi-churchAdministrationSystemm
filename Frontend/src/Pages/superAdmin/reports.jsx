import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const reportCategories = [
  { title: 'Fellowship report', type: 'fellowship', label: 'Fellowship' },
  { title: 'Cells report', type: 'cell', label: 'Cell' },
  { title: 'Ministries report', type: 'ministry', label: 'Ministry' },
  { title: 'Departmental report', type: 'department', label: 'Department' },
];

const headCellStyle = {
  padding: '12px 14px',
  borderBottom: '2px solid #e5e7eb',
  color: '#475569',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const bodyCellStyle = {
  padding: '14px',
  borderBottom: '1px solid #e5e7eb',
  verticalAlign: 'top',
  color: '#334155',
  lineHeight: 1.5,
};

export default function SuperAdminReports() {
  const rows = [reportCategories.slice(0, 2), reportCategories.slice(2, 4)];
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = reportCategories.find(
    (category) => category.type === selectedType
  );

  const visibleGroups = groups.filter(
    (group) => String(group.type || '').toLowerCase() === String(selectedType || '')
  );

  useEffect(() => {
    if (!selectedType) return;

    const controller = new AbortController();

    setLoading(true);
    setError('');
    setGroups([]);

    const loadGroups = async () => {
      try {
        const res = await fetch(`${API_URL}/groups`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || data?.message || 'Failed to load groups');
        }

        setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadGroups();

    return () => controller.abort();
  }, [selectedType]);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
          <h1 className="administration-title">Reports</h1>
        </div>
      </header>

      <section aria-label="Super admin reports overview" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {row.map((category) => {
              const isSelected = selectedType === category.type;

              return (
                <article
                  key={category.type}
                  className="administration-card"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedType(category.type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedType(category.type);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '180px',
                    flex: '1 1 320px',
                    maxWidth: 'calc(50% - 10px)',
                    padding: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      border: `1px solid ${isSelected ? '#60a5fa' : '#1f2937'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      background: '#111827',
                      minHeight: '180px',
                    }}
                  >
                    {category.title}
                  </div>
                </article>
              );
            })}
          </div>
        ))}

        {selectedCategory && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 50,
            }}
            onClick={() => setSelectedType(null)}
          >
            <div
              style={{
                width: 'min(1100px, 100%)',
                maxHeight: '80vh',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: '18px',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
                padding: '24px',
                color: '#111827',
              }}
              onClick={(e) => e.stopPropagation()}
              aria-live="polite"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ margin: 0 }}>{selectedCategory.title}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: '#111827',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              {loading && <p>Loading groups...</p>}

              {!loading && error && <p>{error}</p>}

              {!loading && !error && visibleGroups.length === 0 && (
                <p>No groups found for this category.</p>
              )}

              {!loading && !error && visibleGroups.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={headCellStyle}>{selectedCategory.label}</th>
                        <th style={headCellStyle}>Location</th>
                        <th style={headCellStyle}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleGroups.map((group) => (
                        <tr
                          key={group.id}
                          onClick={() => navigate('/super-admin/dashboard', { state: { group } })}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              navigate('/super-admin/dashboard', { state: { group } });
                            }
                          }}
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={bodyCellStyle}>
                            <strong style={{ color: '#111827' }}>{group.name}</strong>
                          </td>
                          <td style={bodyCellStyle}>{group.location || '—'}</td>
                          <td style={bodyCellStyle}>{group.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
