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

function getLeaderName(ministry) {
  return (
    ministry.leader_name ||
    ministry.leader_full_name ||
    ministry.leader?.full_name ||
    ministry.leader?.name ||
    (ministry.leader_id ? 'Leader assigned' : 'No leader assigned')
  );
}

export default function SuperAdminMinistries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchMinistries() {
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
            data.message || data.error || 'Failed to load ministries.'
          );
        }

        const allGroups = getArray(data);

        const ministryGroups = allGroups.filter(
          (group) =>
            String(group.type || '').toLowerCase() === 'ministry'
        );

        const ministriesWithMembers = await Promise.all(
          ministryGroups.map(async (ministry) => {
            try {
              const membersResponse = await fetch(
                `${API_BASE}/api/user-groups/group/${ministry.id}/members`,
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
                throw new Error('Could not load ministry members.');
              }

              const members = getArray(membersData);

              return {
                ...ministry,
                leaderDisplay: getLeaderName(ministry),
                members: members.length,
                memberCountUnavailable: false,
              };
            } catch (memberError) {
              const existingCount = Number(ministry.member_count);

              return {
                ...ministry,
                leaderDisplay: getLeaderName(ministry),
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
          setMinistries(ministriesWithMembers);
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

    fetchMinistries();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredMinistries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return ministries.filter((ministry) => {
      const name = ministry.name || '';
      const leader = ministry.leaderDisplay || '';

      return `${name} ${leader}`.toLowerCase().includes(query);
    });
  }, [ministries, searchTerm]);

  const totalMembers = ministries.reduce(
    (sum, ministry) =>
      ministry.members === null ? sum : sum + ministry.members,
    0
  );

  const unavailableMemberCounts = ministries.some(
    (ministry) =>
      ministry.memberCountUnavailable || ministry.members === null
  );

  const assignedLeaders = ministries.filter(
    (ministry) =>
      ministry.leader_id ||
      ministry.leader_name ||
      ministry.leader_full_name ||
      ministry.leader?.full_name ||
      ministry.leader?.name
  ).length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Superadmin</p>
          <h1 className="administration-title">Ministries</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search ministries"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section
        className="administration-stats"
        aria-label="Ministries overview"
      >
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total ministries</p>
          <p className="administration-card-value">
            {loading ? '...' : ministries.length}
          </p>
          <p className="administration-card-detail">
            Registered ministries
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Assigned leaders</p>
          <p className="administration-card-value">
            {loading ? '...' : assignedLeaders}
          </p>
          <p className="administration-card-detail">
            Ministries with a leader assigned
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
              : 'Across all ministries'}
          </p>
        </article>
      </section>

      <section
        className="fellowship-member-panel"
        aria-label="Ministry list"
      >
        <div className="fellowship-member-panel-header">
          <h2>Ministry directory</h2>
          <span>
            {loading ? 'Loading...' : `${filteredMinistries.length} total`}
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '12px 0' }}>
            Loading ministries from the database...
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
        ) : ministries.length === 0 ? (
          <p style={{ color: '#64748b', padding: '12px 0' }}>
            No ministries were found in the database.
          </p>
        ) : (
          <div className="admin-grid-list">
            {filteredMinistries.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  color: '#64748b',
                  padding: '8px 0',
                }}
              >
                No ministry matches your search.
              </div>
            ) : (
              filteredMinistries.map((ministry) => (
                <article
                  key={ministry.id}
                  className="admin-grid-item"
                >
                  <div className="admin-grid-item-top">
                    <div
                      className="fellowship-member-avatar"
                      style={{ width: '42px', height: '42px' }}
                    >
                      {(ministry.name || 'M').charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`fellowship-member-status ${
                        ministry.leaderDisplay === 'No leader assigned'
                          ? 'status-absent'
                          : 'status-present'
                      }`}
                      style={{ minWidth: '88px' }}
                    >
                      {ministry.leaderDisplay === 'No leader assigned'
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
                    {ministry.name || 'Unnamed ministry'}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '0.9rem',
                    }}
                  >
                    Leader: {ministry.leaderDisplay}
                  </p>

                  {ministry.location && (
                    <p
                      style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '0.85rem',
                      }}
                    >
                      Location: {ministry.location}
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
                      {ministry.members === null
                        ? 'Unavailable'
                        : ministry.members}
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