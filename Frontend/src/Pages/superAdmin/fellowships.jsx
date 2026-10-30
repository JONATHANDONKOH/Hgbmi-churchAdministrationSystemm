import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'leaders', label: 'Leaders' },
  { value: 'members', label: 'Members' },
];

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

function getRawRole(member) {
  return member?.role || member?.user?.role || member?.group_role || '';
}

function getMemberRole(member) {
  const raw = String(getRawRole(member)).trim();

  if (!raw) return 'Member';

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// A leader is anyone whose role is something other than a plain member.
function isLeader(member) {
  const role = String(getRawRole(member)).trim().toLowerCase();

  return role !== '' && role !== 'member';
}

function getInitial(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
}

function hasAssignedLeader(group) {
  return Boolean(
    group?.leader_id ||
      group?.leader_name ||
      group?.leader_full_name ||
      group?.leader
  );
}

function countRoles(list) {
  const leaders = list.filter(isLeader).length;

  return { leaders, members: list.length - leaders, total: list.length };
}

const tableStyles = {
  wrapper: {
    width: '100%',
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
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
    padding: '12px 16px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: '#f9fafb',
    color: '#475467',
    borderBottom: '1px solid #eaecf0',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  cell: {
    padding: '13px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #f2f4f7',
    verticalAlign: 'middle',
  },
};

// Styles added for the redesigned layout.
const ui = {
  countRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    margin: '14px 0 4px',
  },
  countTile: {
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  leaderTile: { background: '#eef2ff', color: '#253b80' },
  memberTile: { background: '#f2f4f7', color: '#344054' },
  countLabel: {
    fontSize: '12px',
    fontWeight: 600,
    opacity: 0.85,
  },
  countValue: {
    fontSize: '22px',
    fontWeight: 750,
    lineHeight: 1.1,
  },
  totalLine: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#667085',
  },
  detailMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
    margin: '20px 0',
  },
  metaBox: {
    background: '#f9fafb',
    border: '1px solid #eaecf0',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  metaLabel: {
    margin: '0 0 4px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    color: '#667085',
  },
  metaValue: {
    margin: 0,
    fontSize: '14px',
    color: '#172033',
    lineHeight: 1.5,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 14px',
    border: '1px solid #d0d5dd',
    borderRadius: '999px',
    background: '#fff',
    color: '#344054',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  filterButtonActive: {
    background: '#253b80',
    borderColor: '#253b80',
    color: '#fff',
  },
  searchInput: {
    padding: '10px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '220px',
    background: '#fff',
    color: '#172033',
  },
  memberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  avatarLeader: { background: '#eef2ff', color: '#253b80' },
  avatarMember: { background: '#f2f4f7', color: '#475467' },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  badgeLeader: { background: '#eef2ff', color: '#253b80' },
  badgeMember: { background: '#f2f4f7', color: '#475467' },
  emptyBox: {
    margin: '12px 0 0',
    padding: '28px 12px',
    textAlign: 'center',
    color: '#667085',
    fontSize: '14px',
    background: '#f9fafb',
    border: '1px dashed #d0d5dd',
    borderRadius: '12px',
  },
};

function RoleBadge({ member }) {
  const leader = isLeader(member);

  return (
    <span
      style={{
        ...ui.badge,
        ...(leader ? ui.badgeLeader : ui.badgeMember),
      }}
    >
      {getMemberRole(member)}
    </span>
  );
}

export default function AdministrationFellowship() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fellowships, setFellowships] = useState([]);
  const [selectedFellowship, setSelectedFellowship] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');

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
                  leaderCount: 0,
                  plainMemberCount: Number(group.member_count ?? 0),
                  memberCountUnavailable: true,
                };
              }

              const membersData = await membersResponse.json();
              const counts = countRoles(getArray(membersData));

              return {
                ...group,
                memberCount: counts.total,
                leaderCount: counts.leaders,
                plainMemberCount: counts.members,
                memberCountUnavailable: false,
              };
            } catch {
              return {
                ...group,
                memberCount: Number(group.member_count ?? 0),
                leaderCount: 0,
                plainMemberCount: Number(group.member_count ?? 0),
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

  const totalLeaders = fellowships.reduce(
    (total, group) => total + (group.leaderCount || 0),
    0
  );

  const totalPlainMembers = fellowships.reduce(
    (total, group) => total + (group.plainMemberCount || 0),
    0
  );

  const assignedLeaders = fellowships.filter(hasAssignedLeader).length;

  // Counts and list for the open fellowship.
  const roleCounts = useMemo(() => countRoles(members), [members]);

  const visibleMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    return members
      .filter((member) => {
        if (roleFilter === 'leaders' && !isLeader(member)) return false;
        if (roleFilter === 'members' && isLeader(member)) return false;

        if (!query) return true;

        return `${getMemberName(member)} ${getMemberEmail(member)} ${getMemberPhone(member)} ${getMemberRole(member)}`
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        // Leaders first, then alphabetical.
        if (isLeader(a) !== isLeader(b)) return isLeader(a) ? -1 : 1;

        return getMemberName(a).localeCompare(getMemberName(b));
      });
  }, [members, roleFilter, memberSearch]);

  async function openFellowship(group) {
    setSelectedFellowship(group);
    setMembers([]);
    setMembersError('');
    setMembersLoading(true);
    setRoleFilter('all');
    setMemberSearch('');

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
    setRoleFilter('all');
    setMemberSearch('');
  }

  const filterCounts = {
    all: roleCounts.total,
    leaders: roleCounts.leaders,
    members: roleCounts.members,
  };

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Superadmin</p>
          <h1 className="administration-title">
            {selectedFellowship ? selectedFellowship.name : 'Fellowship'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            {selectedFellowship
              ? 'Fellowship overview, leaders and membership directory'
              : 'View registered fellowships with their leaders and members'}
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
              <p className="administration-card-label">Total people</p>
              <p className="administration-card-value">
                {membersLoading ? '...' : roleCounts.total}
              </p>
              <p className="administration-card-detail">
                Leaders and members combined
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">Leaders</p>
              <p className="administration-card-value">
                {membersLoading ? '...' : roleCounts.leaders}
              </p>
              <p className="administration-card-detail">
                Members holding a leadership role
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">Members</p>
              <p className="administration-card-value">
                {membersLoading ? '...' : roleCounts.members}
              </p>
              <p className="administration-card-detail">
                Members without a leadership role
              </p>
            </article>
          </section>

          <div style={ui.detailMeta}>
            <div style={ui.metaBox}>
              <p style={ui.metaLabel}>Fellowship leader</p>
              <p style={ui.metaValue}>{getLeaderName(selectedFellowship)}</p>
            </div>

            <div style={ui.metaBox}>
              <p style={ui.metaLabel}>Location</p>
              <p style={ui.metaValue}>
                {selectedFellowship.location || 'Not specified'}
              </p>
            </div>

            <div style={ui.metaBox}>
              <p style={ui.metaLabel}>Description</p>
              <p style={ui.metaValue}>
                {selectedFellowship.description || 'No description provided'}
              </p>
            </div>
          </div>

          <div className="fellowship-member-panel-header">
            <h2>Leaders and members</h2>
            <span>
              {membersLoading
                ? 'Loading...'
                : `${visibleMembers.length} shown`}
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
            <p style={ui.emptyBox}>
              No members were found for this fellowship.
            </p>
          ) : (
            <>
              <div style={ui.toolbar}>
                <div style={ui.filterRow}>
                  {ROLE_FILTERS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      style={{
                        ...ui.filterButton,
                        ...(roleFilter === option.value
                          ? ui.filterButtonActive
                          : {}),
                      }}
                      onClick={() => setRoleFilter(option.value)}
                    >
                      {option.label} ({filterCounts[option.value]})
                    </button>
                  ))}
                </div>

                <input
                  type="search"
                  aria-label="Search people in this fellowship"
                  style={ui.searchInput}
                  placeholder="Search name, email or phone..."
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                />
              </div>

              {visibleMembers.length === 0 ? (
                <p style={ui.emptyBox}>
                  No one matches the selected filter or search.
                </p>
              ) : (
                <div style={tableStyles.wrapper}>
                  <table style={tableStyles.table}>
                    <thead>
                      <tr>
                        <th
                          style={{ ...tableStyles.headerCell, width: '60px' }}
                        >
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
                      {visibleMembers.map((member, index) => {
                        const leader = isLeader(member);
                        const name = getMemberName(member);

                        return (
                          <tr
                            key={getMemberId(member) ?? `member-${index}`}
                            style={{
                              backgroundColor: leader ? '#fafbff' : '#ffffff',
                            }}
                          >
                            <td
                              style={{
                                ...tableStyles.cell,
                                textAlign: 'center',
                              }}
                            >
                              {index + 1}
                            </td>

                            <td style={tableStyles.cell}>
                              {getMemberId(member) ?? '—'}
                            </td>

                            <td style={tableStyles.cell}>
                              <div style={ui.memberCell}>
                                <div
                                  style={{
                                    ...ui.avatar,
                                    ...(leader
                                      ? ui.avatarLeader
                                      : ui.avatarMember),
                                  }}
                                >
                                  {getInitial(name)}
                                </div>

                                <span style={{ fontWeight: 600 }}>{name}</span>
                              </div>
                            </td>

                            <td style={tableStyles.cell}>
                              {getMemberEmail(member)}
                            </td>

                            <td style={tableStyles.cell}>
                              {getMemberPhone(member)}
                            </td>

                            <td style={tableStyles.cell}>
                              <RoleBadge member={member} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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
              <p className="administration-card-label">Total leaders</p>
              <p className="administration-card-value">
                {loading ? '...' : totalLeaders}
              </p>
              <p className="administration-card-detail">
                {loading
                  ? 'Loading...'
                  : `${assignedLeaders} of ${fellowships.length} fellowships have a leader assigned`}
              </p>
            </article>

            <article className="administration-card fellowship-summary-card">
              <p className="administration-card-label">Total members</p>
              <p className="administration-card-value">
                {loading ? '...' : totalPlainMembers}
              </p>
              <p className="administration-card-detail">
                Members without a leadership role
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
                        {hasAssignedLeader(group)
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

                    <div style={ui.countRow}>
                      <div style={{ ...ui.countTile, ...ui.leaderTile }}>
                        <span style={ui.countLabel}>Leaders</span>
                        <span style={ui.countValue}>
                          {group.memberCountUnavailable
                            ? '—'
                            : group.leaderCount}
                        </span>
                      </div>

                      <div style={{ ...ui.countTile, ...ui.memberTile }}>
                        <span style={ui.countLabel}>Members</span>
                        <span style={ui.countValue}>
                          {group.memberCountUnavailable
                            ? '—'
                            : group.plainMemberCount}
                        </span>
                      </div>
                    </div>

                    <p style={ui.totalLine}>
                      {group.memberCountUnavailable
                        ? 'Counts unavailable'
                        : `${group.memberCount} ${
                            group.memberCount === 1 ? 'person' : 'people'
                          } in total`}
                    </p>

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