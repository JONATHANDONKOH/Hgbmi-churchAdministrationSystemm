import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import SearchBar from '../../component/searchBar';

import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const DepartmentLeaders = ({ groupId: propGroupId }) => {
  const params = useParams();
  const location = useLocation();

  // Support the common ways the group ID may be passed to this page.
  const groupId =
    propGroupId ||
    params.groupId ||
    params.id ||
    location.state?.groupId ||
    location.state?.group?.id ||
    '';

  const [assignments, setAssignments] = useState([]);
  const [groupName, setGroupName] = useState('Department');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaders = useCallback(async (isRefresh = false) => {
    if (!groupId) {
      setError(
        'Group ID is missing. Open this page from the department navigation.'
      );
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch(
        `${API_BASE}/api/group-duties/groups/${groupId}/assignments`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to fetch department leaders.'
        );
      }

      const fetchedAssignments = Array.isArray(data.assignments)
        ? data.assignments
        : [];

      // Only leadership duties belong on this page.
      const leadershipAssignments = fetchedAssignments.filter(
        (assignment) =>
          String(assignment.duty_type || '').toLowerCase() === 'leadership'
      );

      setAssignments(leadershipAssignments);

      if (data.groupName) {
        setGroupName(data.groupName);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching leaders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  // Unique leadership positions for the filter chips, with counts.
  const positions = useMemo(() => {
    const counts = new Map();

    assignments.forEach((assignment) => {
      if (!assignment.duty_name) return;
      counts.set(
        assignment.duty_name,
        (counts.get(assignment.duty_name) || 0) + 1
      );
    });

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  // Avoid counting one person more than once if they hold multiple positions.
  const uniqueLeaders = useMemo(() => {
    return new Set(
      assignments.map((assignment) => String(assignment.user_id))
    ).size;
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesPosition =
        selectedPosition === 'all' ||
        assignment.duty_name === selectedPosition;

      const searchableText = [
        assignment.full_name,
        assignment.email,
        assignment.phone_number,
        assignment.duty_name,
        assignment.duty_description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesPosition && matchesSearch;
    });
  }, [assignments, searchTerm, selectedPosition]);

  // Group the filtered assignments by person so each leader appears once.
  const leaders = useMemo(() => {
    const byPerson = new Map();

    filteredAssignments.forEach((assignment) => {
      const key = String(
        assignment.user_id ?? assignment.email ?? assignment.assignment_id
      );

      if (!byPerson.has(key)) {
        byPerson.set(key, {
          key,
          full_name: assignment.full_name,
          email: assignment.email,
          phone_number: assignment.phone_number,
          positions: [],
        });
      }

      byPerson.get(key).positions.push(assignment);
    });

    return [...byPerson.values()].sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '')
    );
  }, [filteredAssignments]);

  const handleRefresh = () => {
    fetchLeaders(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPosition('all');
  };

  const hasFilters = Boolean(searchTerm) || selectedPosition !== 'all';

  const emptyStyle = {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#667085',
    fontSize: '14px',
  };

  const chipStyle = (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 14px',
    borderRadius: '999px',
    border: active ? '1px solid #253b80' : '1px solid #d0d5dd',
    background: active ? '#253b80' : '#ffffff',
    color: active ? '#ffffff' : '#344054',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  const chipCountStyle = (active) => ({
    padding: '1px 8px',
    borderRadius: '999px',
    background: active ? 'rgba(255,255,255,0.22)' : '#f2f4f7',
    color: active ? '#ffffff' : '#667085',
    fontSize: '12px',
  });

  return (
    <div className="administration-section-page">

      {/* PAGE HEADER */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">{groupName}</p>
          <h1>Leaders</h1>
        </div>

        <div className="dashboard-actions">
          <SearchBar
            placeholder="Search by name, email, phone or position"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="button"
            className="my-button"
            style={{
              background: '#374151',
              opacity: loading || refreshing ? 0.6 : 1,
            }}
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '12px 14px',
            borderRadius: '8px',
            margin: '12px 0',
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: '14px',
          }}
        >
          <span>{error}</span>

          {groupId && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              style={{
                padding: '7px 14px',
                border: '1px solid #b91c1c',
                borderRadius: '7px',
                background: '#ffffff',
                color: '#b91c1c',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!error && (
        <>
          {/* STATISTICS */}
          <section className="administration-stats">
            <article className="administration-card">
              <p className="administration-card-label">Total Leaders</p>

              <p className="administration-card-value">
                {loading ? '—' : uniqueLeaders}
              </p>

              <p className="administration-card-detail">
                People serving in leadership
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">
                Leadership Positions
              </p>

              <p className="administration-card-value">
                {loading ? '—' : positions.length}
              </p>

              <p className="administration-card-detail">
                Different positions in use
              </p>
            </article>

            <article className="administration-card">
              <p className="administration-card-label">
                Leadership Assignments
              </p>

              <p className="administration-card-value">
                {loading ? '—' : assignments.length}
              </p>

              <p className="administration-card-detail">
                Positions assigned to members
              </p>
            </article>
          </section>

          {/* LEADERS PANEL */}
          <section className="fellowship-member-panel">
            <div className="fellowship-member-panel-header">
              <h2>Department Leaders</h2>

              <span>
                {loading
                  ? 'Loading...'
                  : `${leaders.length} ${
                      leaders.length === 1 ? 'leader' : 'leaders'
                    }`}
              </span>
            </div>

            {/* POSITION FILTER CHIPS */}
            {!loading && positions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '0 16px 16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPosition('all')}
                  style={chipStyle(selectedPosition === 'all')}
                >
                  All positions
                  <span style={chipCountStyle(selectedPosition === 'all')}>
                    {assignments.length}
                  </span>
                </button>

                {positions.map((position) => {
                  const active = selectedPosition === position.name;

                  return (
                    <button
                      key={position.name}
                      type="button"
                      onClick={() => setSelectedPosition(position.name)}
                      style={chipStyle(active)}
                    >
                      {position.name}
                      <span style={chipCountStyle(active)}>
                        {position.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ padding: '0 16px 16px' }}>
              {loading ? (
                <p style={emptyStyle}>Loading department leaders...</p>
              ) : leaders.length === 0 ? (
                <div style={emptyStyle}>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '17px',
                      color: '#172033',
                    }}
                  >
                    {assignments.length === 0
                      ? 'No leaders assigned yet'
                      : 'No matching leaders found'}
                  </h3>

                  <p style={{ margin: 0 }}>
                    {assignments.length === 0
                      ? 'Members assigned leadership duties will automatically appear here.'
                      : 'Try changing your search term or selecting another position.'}
                  </p>

                  {hasFilters && (
                    <button
                      type="button"
                      className="my-button"
                      onClick={clearFilters}
                      style={{ background: '#253b80', marginTop: '16px' }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {leaders.map((leader) => {
                    const name = leader.full_name || 'Unnamed Member';

                    return (
                      <article
                        key={leader.key}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        {/* PERSON */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              minWidth: '46px',
                              borderRadius: '50%',
                              background: '#253b80',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '18px',
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '16px',
                                color: '#172033',
                              }}
                            >
                              {name}
                            </h3>

                            {leader.email && (
                              <a
                                href={`mailto:${leader.email}`}
                                style={{
                                  display: 'block',
                                  marginTop: '3px',
                                  color: '#667085',
                                  fontSize: '13px',
                                  textDecoration: 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {leader.email}
                              </a>
                            )}

                            {leader.phone_number && (
                              <a
                                href={`tel:${leader.phone_number}`}
                                style={{
                                  display: 'block',
                                  marginTop: '2px',
                                  color: '#667085',
                                  fontSize: '13px',
                                  textDecoration: 'none',
                                }}
                              >
                                {leader.phone_number}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* POSITIONS */}
                        <div
                          style={{
                            borderTop: '1px solid #f0f1f3',
                            paddingTop: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          {leader.positions.map((position) => (
                            <div key={position.assignment_id}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#eef2ff',
                                  color: '#253b80',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                {position.duty_name || 'Leadership Position'}
                              </span>

                              {position.duty_description && (
                                <p
                                  style={{
                                    margin: '7px 0 0',
                                    color: '#475467',
                                    fontSize: '13px',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {position.duty_description}
                                </p>
                              )}

                              {position.assigned_at && (
                                <small
                                  style={{
                                    display: 'block',
                                    marginTop: '5px',
                                    color: '#98a2b3',
                                    fontSize: '12px',
                                  }}
                                >
                                  Assigned on{' '}
                                  {new Date(
                                    position.assigned_at
                                  ).toLocaleDateString()}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DepartmentLeaders;