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
  if (Array.isArray(data?.users)) return data.users;
  return [];
}

function getLeaderName(group) {
  return (
    group?.leader_name ||
    group?.leader_full_name ||
    group?.leader?.full_name ||
    group?.leader?.name ||
    (group?.leader_id ? 'Leader assigned' : 'No leader assigned')
  );
}

function getMemberName(member) {
  return (
    member?.full_name ||
    member?.name ||
    member?.user?.full_name ||
    member?.user?.name ||
    'Unnamed member'
  );
}

function getMemberId(member) {
  // Prefer the actual user id over a user_groups/join-record id.
  return member?.user_id ?? member?.user?.id ?? member?.member_id ?? member?.id ?? null;
}

function getMemberEmail(member) {
  return member?.email || member?.user?.email || '—';
}

function getMemberPhone(member) {
  return (
    member?.phone_number ||
    member?.phone ||
    member?.user?.phone_number ||
    member?.user?.phone ||
    '—'
  );
}

function getMemberRole(member) {
  return member?.role || member?.user?.role || member?.group_role || 'Member';
}

const tableStyles = {
  wrapper: {
    width: '100%',
    overflowX: 'auto',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
    marginTop: '12px',
  },
  table: {
    width: '100%',
    minWidth: '760px',
    borderCollapse: 'collapse',
    fontSize: '14px',
    color: '#1f2937',
  },
  headerCell: {
    padding: '13px 14px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: '#e8eef5',
    color: '#1e293b',
    border: '1px solid #cbd5e1',
    fontWeight: 700,
  },
  cell: {
    padding: '12px 14px',
    textAlign: 'left',
    border: '1px solid #dbe2ea',
    verticalAlign: 'middle',
  },
};

export default function AdministrationFellowship() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fellowships, setFellowships] = useState([]);
  const [selectedFellowship, setSelectedFellowship] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [membersError, setMembersError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchFellowships() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/groups`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || 'Failed to fetch fellowships.'
          );
        }

        const fellowshipGroups = getArray(data).filter(
          (group) =>
            String(group.type || '').trim().toLowerCase() === 'fellowship'
        );

        const groupsWithCounts = await Promise.all(
          fellowshipGroups.map(async (group) => {
            try {
              const membersResponse = await fetch(
                `${API_BASE}/api/user-groups/group/${group.id}/members`,
                {
                  method: 'GET',
                  credentials: 'include',
                  headers: { Accept: 'application/json' },
                }
              );

              if (!membersResponse.ok) {
                return {
                  ...group,
                  memberCount: Number(group.member_count ?? 0),
                  memberCountUnavailable: true,
                };
              }

              const membersData = await membersResponse.json();
              const groupMembers = getArray(membersData);

              return {
                ...group,
                memberCount: groupMembers.length,
                memberCountUnavailable: false,
              };
            } catch {
              return {
                ...group,
                memberCount: Number(group.member_count ?? 0),
                memberCountUnavailable: true,
              };
            }
          })
        );

        if (!cancelled) setFellowships(groupsWithCounts);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Something went wrong while loading fellowships.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFellowships();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFellowships = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return fellowships.filter((group) => {
      const searchableText = `
        ${group.name || ''}
        ${getLeaderName(group)}
        ${group.location || ''}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [fellowships, searchTerm]);

  const totalMembers = fellowships.reduce(
    (total, group) => total + (group.memberCount || 0),
    0
  );

  const assignedLeaders = fellowships.filter(
    (group) =>
      group.leader_id ||
      group.leader_name ||
      group.leader_full_name ||
      group.leader
  ).length;

  async function openFellowship(group) {
    setSelectedFellowship(group);
    setMembers([]);
    setMembersError('');
    setMembersLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/user-groups/group/${group.id}/members`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Failed to load fellowship members.'
        );
      }

      setMembers(getArray(data));
    } catch (err) {
      setMembersError(
        err.message || 'Unable to load members for this fellowship.'
      );
    } finally {
      setMembersLoading(false);
    }
  }

  function closeFellowship() {
    setSelectedFellowship(null);
    setMembers([]);
    setMembersError('');
  }

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">
            {selectedFellowship ? selectedFellowship.name : 'Fellowship'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            {selectedFellowship
              ? 'Fellowship overview and membership directory'
              : 'View and manage registered fellowships'}
          </p>
        </div>

        {!selectedFellowship && (
          <div className="fellowship-member-search">
            <SearchBar
              placeholder="Search fellowship"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        )}
      </header>

      {selectedFellowship ? (
        <section className="fellowship-member-panel">
          <div className="fellowship-member-panel-header">
            <h2>Fellowship details</h2>
            <button type="button" onClick={closeFellowship}>
              Back to fellowships
            </button>
          </div>

          <section className="administration-stats">
            <article className="administration-card">
              <p className="administration-card-label">Fellowship</p>
              <p className="administration-card-value">
                {selectedFellowship.name || 'Unnamed'}
              </p>
              <p className="administration-card-detail">
                Registered fellowship
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">Leader</p>
              <p className="administration-card-value">
                {getLeaderName(selectedFellowship)}
              </p>
              <p className="administration-card-detail">
                Fellowship leadership
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">Members</p>
              <p className="administration-card-value">
                {membersLoading ? '...' : members.length}
              </p>
              <p className="administration-card-detail">
                Members returned by the API
              </p>
            </article>
          </section>

          <div style={{ margin: '20px 0' }}>
            <p>
              <strong>Location:</strong>{' '}
              {selectedFellowship.location || 'Not specified'}
            </p>
            <p>
              <strong>Description:</strong>{' '}
              {selectedFellowship.description || 'No description provided'}
            </p>
            <p>
              <strong>Leader status:</strong>{' '}
              {selectedFellowship.leader_id ||
              selectedFellowship.leader_name ||
              selectedFellowship.leader_full_name ||
              selectedFellowship.leader
                ? 'Leader assigned'
                : 'No leader assigned'}
            </p>
          </div>

          <div className="fellowship-member-panel-header">
            <h2>Fellowship members</h2>
            <span>
              {membersLoading ? 'Loading...' : `${members.length} members`}
            </span>
          </div>

          {membersLoading ? (
            <p style={{ color: '#64748b', padding: '16px 0' }}>
              Loading fellowship members...
            </p>
          ) : membersError ? (
            <div style={{ color: '#b91c1c', padding: '16px 0' }}>
              <p>{membersError}</p>
              <button
                type="button"
                onClick={() => openFellowship(selectedFellowship)}
              >
                Try again
              </button>
            </div>
          ) : members.length === 0 ? (
            <p style={{ color: '#64748b', padding: '16px 0' }}>
              No members were found for this fellowship.
            </p>
          ) : (
            <div style={tableStyles.wrapper}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={{ ...tableStyles.headerCell, width: '60px' }}>
                      No.
                    </th>
                    <th style={tableStyles.headerCell}>Member ID</th>
                    <th style={tableStyles.headerCell}>Full name</th>
                    <th style={tableStyles.headerCell}>Email address</th>
                    <th style={tableStyles.headerCell}>Phone number</th>
                    <th style={tableStyles.headerCell}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={getMemberId(member) ?? `member-${index}`}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ ...tableStyles.cell, textAlign: 'center' }}>
                        {index + 1}
                      </td>
                      <td style={tableStyles.cell}>
                        {getMemberId(member) ?? '—'}
                      </td>
                      <td style={{ ...tableStyles.cell, fontWeight: 600 }}>
                        {getMemberName(member)}
                      </td>
                      <td style={tableStyles.cell}>
                        {getMemberEmail(member)}
                      </td>
                      <td style={tableStyles.cell}>
                        {getMemberPhone(member)}
                      </td>
                      <td style={tableStyles.cell}>{getMemberRole(member)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          <section
            className="administration-stats"
            aria-label="Fellowship statistics"
          >
            <article className="administration-card fellowship-summary-card">
              <p className="administration-card-label">Total fellowships</p>
              <p className="administration-card-value">
                {loading ? '...' : fellowships.length}
              </p>
              <p className="administration-card-detail">
                Registered fellowships
              </p>
            </article>

            <article className="administration-card fellowship-summary-card">
              <p className="administration-card-label">Assigned leaders</p>
              <p className="administration-card-value">
                {loading ? '...' : assignedLeaders}
              </p>
              <p className="administration-card-detail">
                Fellowships with a leader assigned
              </p>
            </article>

            <article className="administration-card fellowship-summary-card">
              <p className="administration-card-label">Total members</p>
              <p className="administration-card-value">
                {loading ? '...' : totalMembers}
              </p>
              <p className="administration-card-detail">
                Memberships across fellowships
              </p>
            </article>
          </section>

          <section
            className="fellowship-member-panel"
            aria-label="Fellowship list"
          >
            <div className="fellowship-member-panel-header">
              <h2>Fellowship directory</h2>
              <span>
                {loading ? 'Loading...' : `${filteredFellowships.length} total`}
              </span>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', padding: '16px 0' }}>
                Loading fellowships from the database...
              </p>
            ) : error ? (
              <div style={{ color: '#b91c1c', padding: '16px 0' }}>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : filteredFellowships.length === 0 ? (
              <p style={{ color: '#64748b', padding: '16px 0' }}>
                {searchTerm.trim()
                  ? 'No fellowship matches your search.'
                  : 'No fellowship groups were found.'}
              </p>
            ) : (
              <div className="admin-grid-list">
                {filteredFellowships.map((group) => (
                  <article
                    key={group.id}
                    className="admin-grid-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => openFellowship(group)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFellowship(group);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    aria-label={`View ${group.name || 'fellowship'} details`}
                  >
                    <div className="admin-grid-item-top">
                      <div
                        className="fellowship-member-avatar"
                        style={{ width: '42px', height: '42px' }}
                      >
                        {String(group.name || 'F').charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="fellowship-member-status"
                        style={{ minWidth: '88px' }}
                      >
                        {group.leader_id ||
                        group.leader_name ||
                        group.leader_full_name ||
                        group.leader
                          ? 'Leader assigned'
                          : 'No leader'}
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
                      {group.name || 'Unnamed fellowship'}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '0.9rem',
                      }}
                    >
                      Leader: {getLeaderName(group)}
                    </p>

                    {group.location && (
                      <p
                        style={{
                          margin: 0,
                          color: '#64748b',
                          fontSize: '0.85rem',
                        }}
                      >
                        Location: {group.location}
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
                        {group.memberCountUnavailable
                          ? 'Unavailable'
                          : group.memberCount}
                      </strong>
                    </div>

                    <p
                      style={{
                        margin: '12px 0 0',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      View fellowship →
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}