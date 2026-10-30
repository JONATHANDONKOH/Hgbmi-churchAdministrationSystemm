
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const reportCategories = [
  {
    title: 'Fellowship Reports',
    type: 'fellowship',
    label: 'Fellowship',
    description: 'View fellowships and access their reports.',
  },
  {
    title: 'Cell Reports',
    type: 'cell',
    label: 'Cell',
    description: 'View cells and access their reports.',
  },
  {
    title: 'Ministry Reports',
    type: 'ministry',
    label: 'Ministry',
    description: 'View ministries and access their reports.',
  },
  {
    title: 'Department Reports',
    type: 'department',
    label: 'Department',
    description: 'View departments and access their reports.',
  },
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

function getGroups(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function AdministrationReports() {
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedCategory = reportCategories.find(
    (category) => category.type === selectedType
  );

  const visibleGroups = groups.filter(
    (group) =>
      String(group.type || '').toLowerCase() === selectedType
  );

  const filteredGroups = visibleGroups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();

    return (
      !query ||
      `${group.name || ''} ${group.location || ''} ${group.description || ''}`
        .toLowerCase()
        .includes(query)
    );
  });

  useEffect(() => {
    if (!selectedType) return;

    const controller = new AbortController();

    async function loadGroups() {
      setLoading(true);
      setError('');
      setGroups([]);

      try {
        const response = await fetch(`${API_BASE}/api/groups`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || 'Failed to load groups.'
          );
        }

        if (!controller.signal.aborted) {
          setGroups(getGroups(data));
        }
      } catch (err) {
        if (
          err.name !== 'AbortError' &&
          !controller.signal.aborted
        ) {
          setError(err.message || 'Failed to load groups.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadGroups();

    return () => controller.abort();
  }, [selectedType, refreshKey]);

  function openCategory(type) {
    setSearchTerm('');
    setSelectedType(type);
  }

  function closeModal() {
    setSelectedType(null);
    setGroups([]);
    setError('');
    setSearchTerm('');
  }

  function openGroupReport(group) {
    if (group.id == null) {
      setError('This group does not have a valid ID.');
      return;
    }

    navigate(
      `/administration-management/reports/group/${encodeURIComponent(group.id)}`,
      { state: { group } }
    );
  }

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Reports</h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Select a group category, then open a group's report.
          </p>
        </div>
      </header>

      <section
        aria-label="Report categories"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
        }}
      >
        {reportCategories.map((category) => (
          <button
            key={category.type}
            type="button"
            onClick={() => openCategory(category.type)}
            className="administration-card"
            style={{
              minHeight: '190px',
              padding: '24px',
              textAlign: 'left',
              cursor: 'pointer',
              background: '#111827',
              color: '#ffffff',
              border: '1px solid #374151',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.75rem',
                  color: '#93c5fd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Group category
              </p>

              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {category.title}
              </h2>

              <p
                style={{
                  margin: '10px 0 0',
                  color: '#d1d5db',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {category.description}
              </p>
            </div>

            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              View groups →
            </span>
          </button>
        ))}
      </section>

      {selectedCategory && (
        <div
          role="presentation"
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 50,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-group-dialog-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              color: '#111827',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div>
                <h2
                  id="report-group-dialog-title"
                  style={{ margin: 0 }}
                >
                  {selectedCategory.title}
                </h2>

                <p style={{ color: '#64748b' }}>
                  Select a group to view its report.
                </p>
              </div>

              <button type="button" onClick={closeModal}>
                Close
              </button>
            </div>

            {!loading && !error && visibleGroups.length > 0 && (
              <input
                type="search"
                placeholder="Search by group name or location..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                }}
              />
            )}

            {loading && <p>Loading groups...</p>}

            {!loading && error && (
              <div>
                <p style={{ color: '#dc2626' }}>{error}</p>
                <button
                  type="button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && visibleGroups.length === 0 && (
              <p style={{ color: '#64748b' }}>
                No {selectedCategory.label.toLowerCase()} groups found.
              </p>
            )}

            {!loading &&
              !error &&
              visibleGroups.length > 0 &&
              filteredGroups.length === 0 && (
                <p style={{ color: '#64748b' }}>
                  No groups match your search.
                </p>
              )}

            {!loading && !error && filteredGroups.length > 0 && (
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
                      <th style={headCellStyle}>
                        {selectedCategory.label}
                      </th>
                      <th style={headCellStyle}>Location</th>
                      <th style={headCellStyle}>Description</th>
                      <th style={headCellStyle}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGroups.map((group) => (
                      <tr key={group.id}>
                        <td style={bodyCellStyle}>
                          <strong>
                            {group.name || 'Unnamed group'}
                          </strong>
                        </td>

                        <td style={bodyCellStyle}>
                          {group.location || '—'}
                        </td>

                        <td style={bodyCellStyle}>
                          {group.description || '—'}
                        </td>

                        <td style={bodyCellStyle}>
                          <button
                            type="button"
                            onClick={() => openGroupReport(group)}
                            style={{
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '7px',
                              background: '#111827',
                              color: '#ffffff',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
