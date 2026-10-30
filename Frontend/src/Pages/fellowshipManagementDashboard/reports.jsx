
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const ALLOWED_ROLE = 'fellowship_leader';

const reportCategories = [
  {
    title: 'Fellowship Reports',
    type: 'fellowship',
    label: 'Fellowship',
    description: 'View your fellowships and their child fellowships.',
  },
  {
    title: 'Cell Reports',
    type: 'cell',
    label: 'Cell',
    description: 'View cells under your fellowship hierarchy.',
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
  if (Array.isArray(data?.data?.groups)) return data.data.groups;
  return [];
}

function getLoggedInUser(data) {
  return data?.user ?? data?.data?.user ?? data?.data ?? data;
}

function getGroupId(group) {
  return group?.id ?? group?.group_id ?? group?._id;
}

function getParentId(group) {
  return group?.parent_group_id ?? group?.parent_id ?? null;
}

function getGroupType(group) {
  return String(group?.type || '').toLowerCase();
}

function getUserRole(user) {
  return String(user?.role || '').toLowerCase();
}

// Find the fellowships created by the logged-in user.
// Then recursively collect every child group.
function getUserFellowshipHierarchy(allGroups, userId) {
  const rootFellowships = allGroups.filter(
    (group) =>
      getGroupType(group) === 'fellowship' &&
      String(group.created_by) === String(userId)
  );

  const childrenMap = new Map();

  allGroups.forEach((group) => {
    const parentId = getParentId(group);

    if (parentId == null) return;

    const parentKey = String(parentId);

    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }

    childrenMap.get(parentKey).push(group);
  });

  const hierarchy = [];
  const visited = new Set();
  const queue = [...rootFellowships];

  while (queue.length > 0) {
    const currentGroup = queue.shift();
    const currentId = getGroupId(currentGroup);

    if (currentId == null) continue;

    const currentKey = String(currentId);

    if (visited.has(currentKey)) continue;

    visited.add(currentKey);
    hierarchy.push(currentGroup);

    const children = childrenMap.get(currentKey) || [];

    children.forEach((child) => {
      queue.push(child);
    });
  }

  return hierarchy;
}

export default function FellowshipAdministrationReports() {
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
    (group) => getGroupType(group) === selectedType
  );

  const filteredGroups = visibleGroups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();

    const parent = groups.find(
      (item) =>
        String(getGroupId(item)) === String(getParentId(group))
    );

    const searchableText = [
      group.name,
      group.location,
      group.description,
      parent?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return !query || searchableText.includes(query);
  });

  useEffect(() => {
    if (!selectedType) return;

    const controller = new AbortController();

    async function loadGroups() {
      setLoading(true);
      setError('');
      setGroups([]);

      try {
        // 1. Get the logged-in user.
        const userResponse = await fetch(
          `${API_BASE}/api/auth/me`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        const userData = await userResponse.json().catch(() => ({}));

        if (!userResponse.ok) {
          throw new Error(
            userData.message ||
            userData.error ||
            'Could not identify the logged-in user.'
          );
        }

        const user = getLoggedInUser(userData);

        // 2. Check the user's role.
        const userRole = getUserRole(user);

        if (userRole !== ALLOWED_ROLE) {
          throw new Error(
            'Access denied. Only fellowship leaders can view these reports.'
          );
        }

        const userId =
          user?.id ?? user?.user_id ?? user?._id;

        if (userId == null) {
          throw new Error('Logged-in user ID was not found.');
        }

        // 3. Fetch all groups.
        const groupsResponse = await fetch(
          `${API_BASE}/api/groups`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        const groupsData = await groupsResponse.json().catch(() => ({}));

        if (!groupsResponse.ok) {
          throw new Error(
            groupsData.message ||
            groupsData.error ||
            'Failed to load groups.'
          );
        }

        const allGroups = getGroups(groupsData);

        // 4. Find the user's fellowship hierarchy.
        const userHierarchy = getUserFellowshipHierarchy(
          allGroups,
          userId
        );

        if (!controller.signal.aborted) {
          setGroups(userHierarchy);
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
    setError('');
    setSelectedType(type);
  }

  function closeModal() {
    setSelectedType(null);
    setGroups([]);
    setError('');
    setSearchTerm('');
  }

  function getParentGroup(group) {
    return groups.find(
      (item) =>
        String(getGroupId(item)) === String(getParentId(group))
    );
  }

  function openGroupReport(group) {
    const groupId = getGroupId(group);

    if (groupId == null) {
      setError('This group does not have a valid ID.');
      return;
    }

    navigate(
      `/administration-management/reports/group/${encodeURIComponent(
        groupId
      )}`,
      {
        state: { group },
      }
    );
  }

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">
            Fellowship Administration
          </p>

          <h1 className="administration-title">
            Reports
          </h1>

          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Select a group category, then open a group's report.
          </p>
        </div>
      </header>

      {/* REPORT CATEGORY CARDS */}
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

      {/* REPORT GROUP MODAL */}
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
            {/* MODAL HEADER */}
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

            {/* SEARCH */}
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

            {/* LOADING */}
            {loading && <p>Loading groups...</p>}

            {/* ERROR */}
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

            {/* EMPTY GROUPS */}
            {!loading && !error && visibleGroups.length === 0 && (
              <p style={{ color: '#64748b' }}>
                No {selectedCategory.label.toLowerCase()} groups found
                in your fellowship hierarchy.
              </p>
            )}

            {/* NO SEARCH RESULTS */}
            {!loading &&
              !error &&
              visibleGroups.length > 0 &&
              filteredGroups.length === 0 && (
                <p style={{ color: '#64748b' }}>
                  No groups match your search.
                </p>
              )}

            {/* GROUP TABLE */}
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

                      <th style={headCellStyle}>
                        Parent Group
                      </th>

                      <th style={headCellStyle}>
                        Location
                      </th>

                      <th style={headCellStyle}>
                        Description
                      </th>

                      <th style={headCellStyle}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGroups.map((group) => {
                      const parent = getParentGroup(group);

                      return (
                        <tr key={getGroupId(group)}>
                          <td style={bodyCellStyle}>
                            <strong>
                              {group.name || 'Unnamed group'}
                            </strong>
                          </td>

                          <td style={bodyCellStyle}>
                            {parent?.name || 'Root fellowship'}
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
                      );
                    })}
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
