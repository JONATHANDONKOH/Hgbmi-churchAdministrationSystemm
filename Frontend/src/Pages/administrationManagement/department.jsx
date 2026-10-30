
import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.members)) return data.members;
  return [];
}

function getLeaderName(department) {
  return (
    department.leader_name ||
    department.leader_full_name ||
    department.leader?.full_name ||
    department.leader?.name ||
    (department.leader_id ? 'Leader assigned' : 'No leader assigned')
  );
}

export default function AdministrationDepartment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDepartments() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/groups`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || 'Failed to load departments.'
          );
        }

        const allGroups = getArray(data);

        const departmentGroups = allGroups.filter(
          (group) =>
            String(group.type || '').toLowerCase() === 'department'
        );

        const departmentsWithMembers = await Promise.all(
          departmentGroups.map(async (department) => {
            try {
              const membersResponse = await fetch(
                `${API_BASE}/api/user-groups/group/${department.id}/members`,
                {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    Accept: 'application/json',
                  },
                }
              );

              const membersData = await membersResponse
                .json()
                .catch(() => ({}));

              if (!membersResponse.ok) {
                throw new Error('Could not load department members.');
              }

              const members = getArray(membersData);

              return {
                ...department,
                leaderDisplay: getLeaderName(department),
                members: members.length,
                memberCountUnavailable: false,
              };
            } catch (memberError) {
              const existingCount = Number(department.member_count);

              return {
                ...department,
                leaderDisplay: getLeaderName(department),
                members:
                  Number.isFinite(existingCount) && existingCount >= 0
                    ? existingCount
                    : null,
                memberCountUnavailable: true,
              };
            }
          })
        );

        if (!cancelled) {
          setDepartments(departmentsWithMembers);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Something went wrong.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const name = department.name || '';
      const leader = department.leaderDisplay || '';

      return `${name} ${leader}`.toLowerCase().includes(query);
    });
  }, [departments, searchTerm]);

  const assignedLeaders = departments.filter(
    (department) =>
      department.leader_id ||
      department.leader_name ||
      department.leader_full_name ||
      department.leader?.full_name ||
      department.leader?.name
  ).length;

  const totalMembers = departments.reduce(
    (sum, department) =>
      department.members === null ? sum : sum + department.members,
    0
  );

  const unavailableMemberCounts = departments.some(
    (department) =>
      department.memberCountUnavailable || department.members === null
  );

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Departments</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search departments"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section
        className="administration-stats"
        aria-label="Department overview"
      >
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total departments</p>
          <p className="administration-card-value">
            {loading ? '...' : departments.length}
          </p>
          <p className="administration-card-detail">
            Registered departments
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Leaders</p>
          <p className="administration-card-value">
            {loading ? '...' : assignedLeaders}
          </p>
          <p className="administration-card-detail">
            Departments with an assigned leader
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Members</p>
          <p className="administration-card-value">
            {loading
              ? '...'
              : unavailableMemberCounts
                ? '—'
                : totalMembers}
          </p>
          <p className="administration-card-detail">
            {unavailableMemberCounts
              ? 'Some member counts could not be loaded'
              : 'Across all departments'}
          </p>
        </article>
      </section>

      <section
        className="fellowship-member-panel"
        aria-label="Department list"
      >
        <div className="fellowship-member-panel-header">
          <h2>Department directory</h2>
          <span>
            {loading ? 'Loading...' : `${filteredDepartments.length} total`}
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '12px 0' }}>
            Loading departments from the database...
          </p>
        ) : error ? (
          <div style={{ padding: '12px 0' }}>
            <p style={{ color: '#dc2626' }}>{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              style={{
                padding: '8px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : departments.length === 0 ? (
          <p style={{ color: '#64748b', padding: '12px 0' }}>
            No departments were found in the database.
          </p>
        ) : (
          <div className="admin-grid-list">
            {filteredDepartments.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  color: '#64748b',
                  padding: '8px 0',
                }}
              >
                No department matches your search.
              </div>
            ) : (
              filteredDepartments.map((department) => (
                <article
                  key={department.id}
                  className="admin-grid-item"
                >
                  <div className="admin-grid-item-top">
                    <div
                      className="fellowship-member-avatar"
                      style={{ width: '42px', height: '42px' }}
                    >
                      {(department.name || 'D').charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`fellowship-member-status ${
                        department.leaderDisplay === 'No leader assigned'
                          ? 'status-absent'
                          : 'status-present'
                      }`}
                      style={{ minWidth: '88px' }}
                    >
                      {department.leaderDisplay === 'No leader assigned'
                        ? 'No leader'
                        : 'Leader assigned'}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {department.name || 'Unnamed department'}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '0.9rem',
                    }}
                  >
                    Leader: {department.leaderDisplay}
                  </p>

                  {department.location && (
                    <p
                      style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '0.85rem',
                      }}
                    >
                      Location: {department.location}
                    </p>
                  )}

                  <div className="admin-grid-item-body">
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Members
                    </span>
                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '1.1rem',
                      }}
                    >
                      {department.members === null
                        ? 'Unavailable'
                        : department.members}
                    </strong>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
