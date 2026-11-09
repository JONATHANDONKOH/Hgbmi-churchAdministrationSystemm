import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const headCellStyle = {
  padding: '12px 14px',
  borderBottom: '2px solid #e5e7eb',
  color: '#475569',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const bodyCellStyle = {
  padding: '13px 14px',
  borderBottom: '1px solid #e5e7eb',
  color: '#334155',
  verticalAlign: 'top',
  lineHeight: 1.5,
};

const cardStyle = {
  background: '#ffffff',
  padding: '20px',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
};

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (data?.data) {
    return getArray(data.data, keys);
  }

  return [];
}

function getUser(data) {
  return data?.user ?? data?.data?.user ?? data?.data ?? data;
}

function getGroupId(group) {
  return group?.id ?? group?.group_id ?? group?._id;
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

function getStatus(record) {
  return String(
    record?.attendance_status ??
    record?.status ??
    record?.attendance ??
    ''
  ).toLowerCase();
}

function getStatusCount(records, status) {
  return records.filter(
    (record) => getStatus(record) === status
  ).length;
}

function getPersonName(person) {
  return (
    person?.full_name ||
    person?.name ||
    person?.user?.full_name ||
    person?.email ||
    'Unknown member'
  );
}

function getMeetingDate(meeting) {
  return (
    meeting?.meeting_date ||
    meeting?.start_date ||
    meeting?.date ||
    meeting?.created_at
  );
}

function getEventDate(event) {
  return (
    event?.start_date ||
    event?.event_date ||
    event?.date ||
    event?.created_at
  );
}

async function apiGet(endpoint, signal) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed: ${endpoint}`
    );
  }

  return data;
}

function StatCard({ title, value }) {
  return (
    <div style={cardStyle}>
      <p
        style={{
          margin: 0,
          color: '#64748b',
          fontSize: '0.85rem',
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: '10px 0 0',
          fontSize: '1.8rem',
          color: '#111827',
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function DataTable({ columns, rows, emptyText, getKey }) {
  if (rows.length === 0) {
    return (
      <p
        style={{
          color: '#94a3b8',
          textAlign: 'center',
          padding: '30px 10px',
          margin: 0,
        }}
      >
        {emptyText}
      </p>
    );
  }

  return (
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
            {columns.map((column) => (
              <th key={column.label} style={headCellStyle}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={getKey(row, index)}>
              {columns.map((column) => (
                <td key={column.label} style={bodyCellStyle}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SharedReportDM({ groupType: suppliedGroupType }) {
  const location = useLocation();

  const groupType = (
    suppliedGroupType ||
    (location.pathname.toLowerCase().includes('ministry')
      ? 'ministry'
      : 'department')
  ).toLowerCase();

  const groupLabel =
    groupType === 'ministry' ? 'Ministry' : 'Department';

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [duties, setDuties] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);

  const [groupError, setGroupError] = useState('');
  const [reportError, setReportError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('attendance');

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (group) =>
          String(getGroupId(group)) === String(selectedGroupId)
      ) || null,
    [groups, selectedGroupId]
  );

  // =========================================================
  // 1. IDENTIFY USER AND FIND THEIR DEPARTMENT / MINISTRY
  // =========================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadGroups() {
      setLoadingGroups(true);
      setGroupError('');
      setGroups([]);
      setSelectedGroupId('');

      try {
        const userData = await apiGet(
          '/api/auth/me',
          controller.signal
        );

        const currentUser = getUser(userData);

        const userId =
          currentUser?.id ??
          currentUser?.user_id ??
          currentUser?._id;

        if (userId == null) {
          throw new Error(
            'Could not identify the logged-in user.'
          );
        }

        const groupsData = await apiGet(
          '/api/groups',
          controller.signal
        );

        const allGroups = getArray(groupsData, [
          'groups',
          'data',
        ]);

        const myGroups = allGroups.filter((group) => {
          const type = String(group?.type || '').toLowerCase();

          const leaderId =
            group?.leader_id ?? group?.created_by;

          return (
            type === groupType &&
            String(leaderId) === String(userId)
          );
        });

        if (controller.signal.aborted) return;

        setGroups(myGroups);

        if (myGroups.length > 0) {
          setSelectedGroupId(
            String(getGroupId(myGroups[0]))
          );
        }
      } catch (error) {
        if (
          error.name !== 'AbortError' &&
          !controller.signal.aborted
        ) {
          setGroupError(
            error.message || 'Failed to load your group.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingGroups(false);
        }
      }
    }

    loadGroups();

    return () => controller.abort();
  }, [groupType, refreshKey]);

  // =========================================================
  // 2. FETCH ALL RECORDS BELONGING TO THE SELECTED GROUP
  // =========================================================

  const loadReports = useCallback(async (signal) => {
    if (!selectedGroupId) return;

    setLoadingReports(true);
    setReportError('');

    setMembers([]);
    setSessions([]);
    setAttendanceDetails([]);
    setEvents([]);
    setMeetings([]);
    setDuties([]);
    setAssignments([]);

    const groupId = encodeURIComponent(selectedGroupId);

    try {
      const requests = await Promise.allSettled([
        apiGet(`/api/user-groups/group/${groupId}/members`, signal),
        apiGet(`/api/attendance/sessions/${groupId}`, signal),
        apiGet(`/api/events/group/${groupId}`, signal),
        apiGet(`/api/meetings?groupId=${groupId}`, signal),
        apiGet(`/api/group-duties/groups/${groupId}`, signal),
        apiGet(`/api/group-duties/groups/${groupId}/assignments`, signal),
      ]);

      if (signal.aborted) return;

      const [
        membersResult,
        sessionsResult,
        eventsResult,
        meetingsResult,
        dutiesResult,
        assignmentsResult,
      ] = requests;

      const errors = [];

      if (membersResult.status === 'fulfilled') {
        setMembers(getArray(membersResult.value, ['members']));
      } else {
        errors.push('Members');
      }

      let loadedSessions = [];

      if (sessionsResult.status === 'fulfilled') {
        loadedSessions = getArray(sessionsResult.value, ['sessions']);
        setSessions(loadedSessions);
      } else {
        errors.push('Attendance');
      }

      if (eventsResult.status === 'fulfilled') {
        setEvents(getArray(eventsResult.value, ['events']));
      } else {
        errors.push('Events');
      }

      if (meetingsResult.status === 'fulfilled') {
        setMeetings(getArray(meetingsResult.value, ['meetings']));
      } else {
        errors.push('Meetings');
      }

      if (dutiesResult.status === 'fulfilled') {
        setDuties(getArray(dutiesResult.value, ['duties']));
      } else {
        errors.push('Duties');
      }

      if (assignmentsResult.status === 'fulfilled') {
        setAssignments(
          getArray(assignmentsResult.value, ['assignments'])
        );
      } else {
        errors.push('Duty assignments');
      }

      const attendanceResults = await Promise.allSettled(
        loadedSessions.map(async (session) => {
          const sessionId =
            session?.id ??
            session?.session_id ??
            session?._id;

          if (sessionId == null) {
            return { session, records: [] };
          }

          const result = await apiGet(
            `/api/attendance/sessions/${encodeURIComponent(
              sessionId
            )}/members`,
            signal
          );

          return {
            session,
            records: getArray(result, [
              'members',
              'records',
              'attendance',
            ]),
          };
        })
      );

      if (signal.aborted) return;

      const details = [];

      attendanceResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          details.push(result.value);
        } else {
          errors.push('Some attendance records');
        }
      });

      setAttendanceDetails(details);

      if (errors.length > 0) {
        setReportError(
          `Some information could not be loaded: ${[
            ...new Set(errors),
          ].join(', ')}.`
        );
      }
    } catch (error) {
      if (!signal.aborted) {
        setReportError(
          error.message || 'Failed to load group reports.'
        );
      }
    } finally {
      if (!signal.aborted) {
        setLoadingReports(false);
      }
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;

    const controller = new AbortController();

    loadReports(controller.signal);

    return () => controller.abort();
  }, [selectedGroupId, loadReports, refreshKey]);

  // =========================================================
  // 3. CALCULATIONS
  // =========================================================

  const allAttendanceRecords = useMemo(
    () => attendanceDetails.flatMap((item) => item.records),
    [attendanceDetails]
  );

  const attendanceRate = useMemo(() => {
    const total = allAttendanceRecords.length;

    if (total === 0) return 0;

    const attended =
      getStatusCount(allAttendanceRecords, 'present') +
      getStatusCount(allAttendanceRecords, 'late');

    return Math.round((attended / total) * 100);
  }, [allAttendanceRecords]);

  // Names of members assigned to each duty
  const dutyAssignees = useMemo(() => {
    const map = {};

    assignments.forEach((assignment) => {
      const key = String(
        assignment.duty_id ??
        assignment.duty?.id ??
        assignment.duty_name ??
        assignment.duty?.name ??
        ''
      );

      const name = getPersonName(
        assignment.user || assignment.member || assignment
      );

      if (!map[key]) map[key] = [];
      map[key].push(name);
    });

    return map;
  }, [assignments]);

  function getDutyAssignees(duty) {
    const names =
      dutyAssignees[String(duty.id ?? duty.duty_id)] ||
      dutyAssignees[String(duty.name ?? duty.duty_name)] ||
      [];

    return names.length > 0 ? names.join(', ') : '—';
  }

  function refreshReports() {
    setRefreshKey((value) => value + 1);
  }

  // =========================================================
  // 4. TABS
  // =========================================================

  const tabs = [
    { id: 'attendance', label: 'Attendance', count: sessions.length },
    { id: 'members', label: 'Members', count: members.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'meetings', label: 'Meetings', count: meetings.length },
    { id: 'duties', label: 'Duties', count: duties.length },
  ];

  const tables = {
    attendance: {
      columns: [
        {
          label: 'Session',
          render: (item) => (
            <strong>
              {item.session?.session_name ||
                item.session?.name ||
                item.session?.title ||
                'Attendance session'}
            </strong>
          ),
        },
        {
          label: 'Date',
          render: (item) =>
            formatDate(
              item.session?.attendance_date ||
              item.session?.date ||
              item.session?.created_at
            ),
        },
        {
          label: 'Present',
          render: (item) => getStatusCount(item.records, 'present'),
        },
        {
          label: 'Absent',
          render: (item) => getStatusCount(item.records, 'absent'),
        },
        {
          label: 'Late',
          render: (item) => getStatusCount(item.records, 'late'),
        },
        {
          label: 'Excused',
          render: (item) => getStatusCount(item.records, 'excused'),
        },
      ],
      rows: attendanceDetails,
      emptyText: 'No attendance records found.',
      getKey: (item, index) =>
        item.session?.id ?? item.session?.session_id ?? index,
    },

    members: {
      columns: [
        {
          label: 'Name',
          render: (member) => <strong>{getPersonName(member)}</strong>,
        },
        { label: 'Email', render: (member) => member.email || '—' },
        {
          label: 'Phone',
          render: (member) => member.phone_number || '—',
        },
        { label: 'Role', render: (member) => member.role || 'Member' },
      ],
      rows: members,
      emptyText: 'No members found.',
      getKey: (member, index) => member.id ?? member.user_id ?? index,
    },

    events: {
      columns: [
        {
          label: 'Event',
          render: (event) => (
            <strong>
              {event.title || event.name || 'Untitled event'}
            </strong>
          ),
        },
        {
          label: 'Date',
          render: (event) => formatDateTime(getEventDate(event)),
        },
        {
          label: 'Location',
          render: (event) =>
            event.event_location || event.location || '—',
        },
      ],
      rows: events,
      emptyText: 'No events found.',
      getKey: (event, index) => event.id ?? event._id ?? index,
    },

    meetings: {
      columns: [
        {
          label: 'Meeting',
          render: (meeting) => (
            <strong>
              {meeting.title ||
                meeting.meeting_name ||
                meeting.name ||
                'Untitled meeting'}
            </strong>
          ),
        },
        {
          label: 'Date',
          render: (meeting) => formatDateTime(getMeetingDate(meeting)),
        },
        {
          label: 'Location',
          render: (meeting) =>
            meeting.location || meeting.meeting_location || '—',
        },
      ],
      rows: meetings,
      emptyText: 'No meetings found.',
      getKey: (meeting, index) => meeting.id ?? meeting._id ?? index,
    },

    duties: {
      columns: [
        {
          label: 'Duty',
          render: (duty) => (
            <strong>
              {duty.name || duty.duty_name || 'Unnamed duty'}
            </strong>
          ),
        },
        {
          label: 'Assigned To',
          render: (duty) => getDutyAssignees(duty),
        },
      ],
      rows: duties,
      emptyText: 'No duties found.',
      getKey: (duty, index) => duty.id ?? duty.duty_id ?? index,
    },
  };

  const activeTable = tables[activeTab];

  // =========================================================
  // 5. RENDER
  // =========================================================

  return (
    <div className="administration-section-page">
      <header
        className="administration-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="administration-eyebrow">
            {groupLabel} Management
          </p>

          <h1 className="administration-title">Reports</h1>

          {selectedGroup && (
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              {selectedGroup.name}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {groups.length > 1 && (
            <select
              value={selectedGroupId}
              onChange={(event) =>
                setSelectedGroupId(event.target.value)
              }
              style={{
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
              }}
            >
              {groups.map((group) => (
                <option
                  key={getGroupId(group)}
                  value={String(getGroupId(group))}
                >
                  {group.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={refreshReports}
            disabled={loadingGroups || loadingReports}
            style={{
              padding: '11px 18px',
              border: 'none',
              borderRadius: '8px',
              background: '#111827',
              color: '#ffffff',
              cursor: 'pointer',
              opacity: loadingGroups || loadingReports ? 0.6 : 1,
            }}
          >
            {loadingGroups || loadingReports
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </header>

      {loadingGroups && (
        <div style={cardStyle}>
          Loading your {groupLabel.toLowerCase()}...
        </div>
      )}

      {!loadingGroups && groupError && (
        <div style={{ ...cardStyle, color: '#dc2626' }}>
          <p style={{ marginTop: 0 }}>{groupError}</p>

          <button type="button" onClick={refreshReports}>
            Try again
          </button>
        </div>
      )}

      {!loadingGroups && !groupError && groups.length === 0 && (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: '#64748b' }}>
            No {groupLabel.toLowerCase()} found for your leadership
            account.
          </p>
        </div>
      )}

      {!loadingGroups && selectedGroup && (
        <>
          {loadingReports && (
            <div style={cardStyle}>
              Loading {groupLabel.toLowerCase()} reports...
            </div>
          )}

          {!loadingReports && reportError && (
            <div
              style={{
                padding: '13px 16px',
                background: '#fff7ed',
                color: '#9a3412',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              {reportError}
            </div>
          )}

          {!loadingReports && (
            <>
              {/* STATS */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '15px',
                }}
              >
                <StatCard title="Members" value={members.length} />
                <StatCard
                  title="Attendance Rate"
                  value={`${attendanceRate}%`}
                />
                <StatCard
                  title="Events & Meetings"
                  value={events.length + meetings.length}
                />
                <StatCard title="Duties" value={duties.length} />
              </div>

              {/* TABS + TABLE */}

              <div style={{ ...cardStyle, marginTop: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}
                >
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: isActive
                            ? '1px solid #111827'
                            : '1px solid #e5e7eb',
                          background: isActive ? '#111827' : '#ffffff',
                          color: isActive ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                        }}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    );
                  })}
                </div>

                <DataTable
                  columns={activeTable.columns}
                  rows={activeTable.rows}
                  emptyText={activeTable.emptyText}
                  getKey={activeTable.getKey}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}