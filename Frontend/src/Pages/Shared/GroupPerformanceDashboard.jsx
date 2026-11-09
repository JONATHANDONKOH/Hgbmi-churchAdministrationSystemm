import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../../styles/administrationManagement.css';
import groupDashboardConfig from '../../Config/groupDashboardConfig';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const COLORS = {
  present: '#16a34a',
  absent: '#dc2626',
  meetings: '#6366f1',
  events: '#0ea5e9',
  duties: '#8b5cf6',
  members: '#111827',
  cells: '#f59e0b',
};

// ==========================================================
// LAYOUT STYLES
// ==========================================================

const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 20px 48px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '22px',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  gap: '16px',
};

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
};

const chartGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: '20px',
};

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '0.85rem',
};

const navButtonStyle = {
  width: '38px',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: '#334155',
  fontSize: '1.1rem',
  cursor: 'pointer',
  borderRadius: '8px',
};

// ==========================================================
// HELPERS
// ==========================================================

const getArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.groups)) return response.groups;
  if (Array.isArray(response?.members)) return response.members;
  if (Array.isArray(response?.sessions)) return response.sessions;
  if (Array.isArray(response?.events)) return response.events;
  if (Array.isArray(response?.meetings)) return response.meetings;
  if (Array.isArray(response?.duties)) return response.duties;
  if (Array.isArray(response?.assignments)) return response.assignments;

  return [];
};

const getDateKey = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatNumber = (value) =>
  new Intl.NumberFormat().format(value || 0);

// ==========================================================
// SMALL COMPONENTS
// ==========================================================

function StatCard({ label, value, note, accent }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <span
        style={{
          color: '#64748b',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: '#111827',
          fontSize: '2rem',
          lineHeight: 1.1,
        }}
      >
        {value}
      </strong>

      <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
        {note}
      </small>
    </div>
  );
}

function ChartCard({
  title,
  description,
  empty,
  emptyText,
  height = 280,
  wide = false,
  overlay,
  footer,
  children,
}) {
  return (
    <section
      style={{
        ...cardStyle,
        gridColumn: wide ? '1 / -1' : undefined,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: '1.05rem',
            color: '#111827',
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {empty ? (
        <div
          style={{
            flex: 1,
            minHeight: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#94a3b8',
            background: '#f8fafc',
            borderRadius: '10px',
            padding: '20px',
            fontSize: '0.9rem',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>

            {overlay}
          </div>

          {footer}
        </>
      )}
    </section>
  );
}

function LegendDot({ color, label }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.85rem',
        color: '#475569',
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

function PageMessage({ children }) {
  return (
    <div className="admin-page" style={pageStyle}>
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

// ==========================================================
// PAGE
// ==========================================================

const GroupPerformanceDashboard = ({
  groupId: providedGroupId,
  expectedGroupType,
}) => {
  const { groupId: routeGroupId } = useParams();

  const groupId = providedGroupId ?? routeGroupId;

  const [group, setGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [duties, setDuties] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const request = async (url) => {
    const response = await fetch(`${API_BASE}${url}`, {
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `Request failed: ${response.status}`
      );
    }

    return data;
  };

  // ==========================================================
  // LOAD GROUP PERFORMANCE DATA
  // ==========================================================

  useEffect(() => {
    if (
      groupId === undefined ||
      groupId === null ||
      String(groupId).trim() === ''
    ) {
      setGroup(null);
      setError('No group ID was provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const groupsResponse = await request('/api/groups');

        const allGroups = getArray(groupsResponse);

        const selectedGroup = allGroups.find((item) => {
          const sameId = String(item.id) === String(groupId);

          const sameType =
            !expectedGroupType ||
            String(item.type || '').toLowerCase() ===
              expectedGroupType.toLowerCase();

          return sameId && sameType;
        });

        if (!selectedGroup) {
          throw new Error(
            expectedGroupType
              ? `Group not found or you do not have access to this ${expectedGroupType}.`
              : 'Group not found or you do not have access to it.'
          );
        }

        if (cancelled) return;

        setGroup(selectedGroup);
        setGroups(allGroups);

        const results = await Promise.allSettled([
          request(`/api/user-groups/group/${groupId}/members`),
          request(`/api/attendance/sessions/${groupId}`),
          request(`/api/events/group/${groupId}`),
          request(`/api/meetings?groupId=${groupId}`),
          request(`/api/group-duties/groups/${groupId}`),
          request(`/api/group-duties/groups/${groupId}/assignments`),
        ]);

        if (cancelled) return;

        const [
          membersResult,
          sessionsResult,
          eventsResult,
          meetingsResult,
          dutiesResult,
          assignmentsResult,
        ] = results;

        const loadedMembers =
          membersResult.status === 'fulfilled'
            ? getArray(membersResult.value)
            : [];

        const loadedSessions =
          sessionsResult.status === 'fulfilled'
            ? getArray(sessionsResult.value)
            : [];

        const loadedEvents =
          eventsResult.status === 'fulfilled'
            ? getArray(eventsResult.value)
            : [];

        const loadedMeetings =
          meetingsResult.status === 'fulfilled'
            ? getArray(meetingsResult.value)
            : [];

        const loadedDuties =
          dutiesResult.status === 'fulfilled'
            ? getArray(dutiesResult.value)
            : [];

        const loadedAssignments =
          assignmentsResult.status === 'fulfilled'
            ? getArray(assignmentsResult.value)
            : [];

        setMembers(loadedMembers);
        setSessions(loadedSessions);
        setEvents(loadedEvents);
        setMeetings(loadedMeetings);
        setDuties(loadedDuties);
        setAssignments(loadedAssignments);

        const attendanceResults = await Promise.allSettled(
          loadedSessions.map((session) =>
            request(`/api/attendance/sessions/${session.id}/members`)
          )
        );

        if (cancelled) return;

        const allAttendance = [];

        attendanceResults.forEach((result, index) => {
          if (result.status !== 'fulfilled') return;

          const sessionMembers = getArray(result.value);
          const session = loadedSessions[index];

          sessionMembers.forEach((member) => {
            allAttendance.push({
              ...member,
              sessionId: session.id,
              sessionDate:
                session.attendance_date || session.created_at,
              submittedAt: session.submitted_at,
            });
          });
        });

        setAttendanceRecords(allAttendance);
      } catch (err) {
        if (!cancelled) {
          console.error('Group dashboard loading error:', err);

          setError(err.message || 'Unable to load group dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [groupId, expectedGroupType]);

  // ==========================================================
  // GROUP CONFIGURATION
  // ==========================================================

  const groupType = String(group?.type || '').toLowerCase();

  const config = groupDashboardConfig[groupType];

  // ==========================================================
  // SELECTED MONTH
  // ==========================================================

  const monthStart = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const monthLabel = monthStart.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const monthShort = monthStart.toLocaleDateString(undefined, {
    month: 'short',
  });

  const shiftMonth = (amount) => {
    const [year, month] = selectedMonth.split('-').map(Number);

    const next = new Date(year, month - 1 + amount, 1);

    setSelectedMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(
        2,
        '0'
      )}`
    );
  };

  // ==========================================================
  // DAILY CHART DATA
  // ==========================================================

  const dailyData = useMemo(() => {
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        day
      );

      const dateKey = getDateKey(date);

      const dayAttendance = attendanceRecords.filter(
        (record) =>
          getDateKey(record.sessionDate) === dateKey &&
          Boolean(record.submittedAt)
      );

      const present = dayAttendance.filter(
        (record) => record.status === 'present'
      ).length;

      const absent = dayAttendance.filter(
        (record) => record.status === 'absent'
      ).length;

      const hasData = present + absent > 0;

      days.push({
        day,
        present: hasData ? present : null,
        absent: hasData ? absent : null,
        meetings: meetings.filter(
          (meeting) => getDateKey(meeting.start_date) === dateKey
        ).length,
        events: events.filter(
          (event) => getDateKey(event.start_date) === dateKey
        ).length,
      });
    }

    return days;
  }, [attendanceRecords, daysInMonth, events, meetings, monthStart]);

  // ==========================================================
  // MONTHLY STATISTICS
  // ==========================================================

  const monthlyStats = useMemo(() => {
    const monthAttendance = attendanceRecords.filter(
      (record) =>
        getDateKey(record.sessionDate)?.startsWith(selectedMonth) &&
        Boolean(record.submittedAt)
    );

    const count = (status) =>
      monthAttendance.filter((record) => record.status === status).length;

    const present = count('present');
    const absent = count('absent');

    const recorded = present + absent;

    return {
      present,
      absent,
      recorded,
      attendanceRate:
        recorded > 0 ? Math.round((present / recorded) * 100) : null,
      meetings: meetings.filter((meeting) =>
        getDateKey(meeting.start_date)?.startsWith(selectedMonth)
      ).length,
      events: events.filter((event) =>
        getDateKey(event.start_date)?.startsWith(selectedMonth)
      ).length,
      newMembers: members.filter((member) =>
        getDateKey(member.created_at)?.startsWith(selectedMonth)
      ).length,
    };
  }, [attendanceRecords, events, meetings, members, selectedMonth]);

  const attendancePieData = useMemo(
    () =>
      [
        { name: 'Present', value: monthlyStats.present, color: COLORS.present },
        { name: 'Absent', value: monthlyStats.absent, color: COLORS.absent },
      ].filter((item) => item.value > 0),
    [monthlyStats]
  );

  const dutyTypeData = useMemo(() => {
    const counts = {};

    duties.forEach((duty) => {
      const type = duty.duty_type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [duties]);

  const childCells = useMemo(
    () =>
      groups.filter(
        (item) =>
          String(item.parent_group_id) === String(groupId) &&
          String(item.type).toLowerCase() === 'cell'
      ),
    [groups, groupId]
  );

  // ==========================================================
  // LOADING / ERROR / UNSUPPORTED STATES
  // ==========================================================

  if (loading) {
    return (
      <PageMessage>Loading group performance dashboard...</PageMessage>
    );
  }

  if (error) {
    return (
      <PageMessage>
        <h2 style={{ marginTop: 0 }}>Unable to load dashboard</h2>

        <p style={{ color: '#64748b' }}>{error}</p>

        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </PageMessage>
    );
  }

  if (!group || !config) {
    return (
      <PageMessage>
        <h2 style={{ marginTop: 0 }}>Unsupported group type</h2>

        <p style={{ color: '#64748b', marginBottom: 0 }}>
          This dashboard does not have a configuration for
          {` ${groupType || 'this group'}`}.
        </p>
      </PageMessage>
    );
  }

  const showActivityChart = config.showMeetings || config.showEvents;

  const pieTotal = attendancePieData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const rateColor =
    monthlyStats.attendanceRate === null
      ? '#94a3b8'
      : monthlyStats.attendanceRate >= 75
        ? COLORS.present
        : monthlyStats.attendanceRate >= 50
          ? '#f59e0b'
          : COLORS.absent;

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="admin-page" style={pageStyle}>
      {/* HEADER */}

      <header style={headerStyle}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              color: '#111827',
            }}
          >
            {config.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#111827',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {group.name}
            </span>

            {group.location && (
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.8rem',
                }}
              >
                {group.location}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <label
            htmlFor="performance-month"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Showing results for
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              style={navButtonStyle}
            >
              ←
            </button>

            <input
              id="performance-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#111827',
                padding: '0 6px',
              }}
            />

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              style={navButtonStyle}
            >
              →
            </button>
          </div>
        </div>
      </header>

      {/* KEY NUMBERS */}

      <section style={statGridStyle}>
        <StatCard
          label="Members"
          value={formatNumber(members.length)}
          note={`${formatNumber(monthlyStats.newMembers)} joined in ${monthShort}`}
          accent={COLORS.members}
        />

        {config.showAttendance && (
          <StatCard
            label="Attendance"
            value={
              monthlyStats.attendanceRate === null
                ? 'No data'
                : `${monthlyStats.attendanceRate}%`
            }
            note={`${monthlyStats.present} present · ${monthlyStats.absent} absent`}
            accent={rateColor}
          />
        )}

        {config.showMeetings && (
          <StatCard
            label="Meetings"
            value={monthlyStats.meetings}
            note={`Scheduled in ${monthLabel}`}
            accent={COLORS.meetings}
          />
        )}

        {config.showEvents && (
          <StatCard
            label="Events"
            value={monthlyStats.events}
            note={`Scheduled in ${monthLabel}`}
            accent={COLORS.events}
          />
        )}

        {config.showCells && (
          <StatCard
            label="Cells"
            value={childCells.length}
            note="Under this fellowship"
            accent={COLORS.cells}
          />
        )}

        {config.showDuties && (
          <StatCard
            label="Duties"
            value={duties.length}
            note={`${assignments.length} members assigned`}
            accent={COLORS.duties}
          />
        )}
      </section>

      {/* CHARTS */}

      <div style={chartGridStyle}>
        {config.showAttendance && (
          <ChartCard
            title="Attendance trend"
            description={`Each dot is a day when attendance was taken in ${monthLabel}.`}
            empty={monthlyStats.recorded === 0}
            emptyText="No attendance has been submitted for this month."
            wide
            height={320}
          >
            <LineChart
              data={dailyData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                interval={0}
                minTickGap={4}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(day) => `${monthShort} ${day}`}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="present"
                name="Present"
                stroke={COLORS.present}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="absent"
                name="Absent"
                stroke={COLORS.absent}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ChartCard>
        )}

        {config.showAttendance && (
          <ChartCard
            title="Present vs absent"
            description="How attendance is split this month."
            empty={attendancePieData.length === 0}
            emptyText="No attendance has been submitted for this month."
            height={240}
            overlay={
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <strong style={{ fontSize: '1.6rem', color: '#111827' }}>
                  {monthlyStats.attendanceRate}%
                </strong>

                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  present
                </span>
              </div>
            }
            footer={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '10px 20px',
                  marginTop: '14px',
                }}
              >
                {attendancePieData.map((item) => (
                  <LegendDot
                    key={item.name}
                    color={item.color}
                    label={`${item.name}: ${item.value} (${Math.round(
                      (item.value / pieTotal) * 100
                    )}%)`}
                  />
                ))}
              </div>
            }
          >
            <PieChart>
              <Pie
                data={attendancePieData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={2}
              >
                {attendancePieData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  `${value} (${Math.round((value / pieTotal) * 100)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ChartCard>
        )}

        {showActivityChart && (
          <ChartCard
            title="Meetings and events"
            description="Days that have a meeting or event scheduled."
            empty={monthlyStats.meetings + monthlyStats.events === 0}
            emptyText="No meetings or events are scheduled for this month."
            height={240}
          >
            <BarChart data={dailyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                interval="preserveStartEnd"
                minTickGap={8}
                tick={{ fontSize: 12 }}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: '#f1f5f9' }}
                labelFormatter={(day) => `${monthShort} ${day}`}
              />

              <Legend />

              {config.showMeetings && (
                <Bar
                  dataKey="meetings"
                  name="Meetings"
                  fill={COLORS.meetings}
                  radius={[4, 4, 0, 0]}
                />
              )}

              {config.showEvents && (
                <Bar
                  dataKey="events"
                  name="Events"
                  fill={COLORS.events}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ChartCard>
        )}

        {config.showDuties && (
          <ChartCard
            title="Duties by type"
            description={`${duties.length} duties in total, ${assignments.length} members assigned.`}
            empty={dutyTypeData.length === 0}
            emptyText="No duties have been created yet."
            height={240}
          >
            <BarChart data={dutyTypeData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />

              <XAxis dataKey="name" tick={{ fontSize: 12 }} />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: '#f1f5f9' }}
              />

              <Bar
                dataKey="value"
                name="Duties"
                fill={COLORS.duties}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartCard>
        )}
      </div>

      {/* CHILD CELLS */}

      {config.showCells && (
        <section style={cardStyle}>
          <h2
            style={{
              margin: '0 0 14px',
              fontSize: '1.05rem',
              color: '#111827',
            }}
          >
            Cells under this fellowship
          </h2>

          {childCells.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8' }}>
              No cells have been added to this fellowship yet.
            </p>
          ) : (
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
                    {['Cell name', 'Location'].map((label) => (
                      <th
                        key={label}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '2px solid #e5e7eb',
                          color: '#475569',
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {childCells.map((cell) => (
                    <tr key={cell.id}>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #e5e7eb',
                          color: '#111827',
                          fontWeight: 600,
                        }}
                      >
                        {cell.name}
                      </td>

                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #e5e7eb',
                          color: '#475569',
                        }}
                      >
                        {cell.location || 'Not provided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <p
        style={{
          margin: 0,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.8rem',
        }}
      >
        Attendance figures only include submitted attendance marked
        present or absent. Meetings and events show what is scheduled,
        not whether it took place.
      </p>
    </div>
  );
};

export default GroupPerformanceDashboard;