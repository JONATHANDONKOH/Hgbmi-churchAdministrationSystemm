import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_ROOT = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const API_URL = API_ROOT.endsWith('/api')
  ? API_ROOT
  : `${API_ROOT}/api`;

const reportCards = [
  { id: 'attendance', title: 'Attendance' },
  { id: 'events', title: 'Events' },
  { id: 'meetings', title: 'Meetings' },
  { id: 'membership', title: 'Membership' },
  { id: 'finance', title: 'Financial' },
];

const ATTENDANCE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
  { value: 'unrecorded', label: 'Not marked' },
];

// Order in which statuses are listed inside the session popup.
const SESSION_STATUS_ORDER = [
  'present',
  'late',
  'absent',
  'excused',
  'unrecorded',
];

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    color: '#172033',
  },
  headerCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: '0 0 6px',
    color: '#667085',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 750,
    color: '#172033',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '10px',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    background: '#eef2ff',
    color: '#253b80',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  locationText: {
    color: '#667085',
    fontSize: '14px',
  },
  warning: {
    background: '#fffaeb',
    border: '1px solid #fedf89',
    color: '#93370d',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  warningList: {
    margin: '8px 0 0',
    paddingLeft: '18px',
    lineHeight: 1.6,
  },
  errorBox: {
    background: '#fef3f2',
    border: '1px solid #fecdca',
    color: '#b42318',
    borderRadius: '12px',
    padding: '16px 18px',
    fontSize: '14px',
  },
  loadingBox: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '32px',
    textAlign: 'center',
    color: '#667085',
  },
  dateBar: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '14px',
    flexWrap: 'wrap',
  },
  dateField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dateLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#344054',
  },
  dateInput: {
    padding: '10px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    color: '#172033',
  },
  dateHint: {
    flex: '1 1 220px',
    margin: 0,
    fontSize: '14px',
    color: '#667085',
    alignSelf: 'center',
  },
  secondaryButton: {
    padding: '10px 14px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    background: '#fff',
    color: '#344054',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sectionLabel: {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: '#667085',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  overviewCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    cursor: 'pointer',
  },
  overviewCardActive: {
    border: '2px solid #253b80',
    background: '#f5f7ff',
    padding: '19px',
  },
  overviewCardDisabled: {
    background: '#f9fafb',
    cursor: 'default',
  },
  overviewTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#667085',
  },
  overviewValue: {
    fontSize: '30px',
    fontWeight: 750,
    lineHeight: 1.1,
    color: '#172033',
  },
  overviewNote: {
    fontSize: '13px',
    color: '#667085',
  },
  overviewLink: {
    marginTop: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#253b80',
  },
  placeholder: {
    margin: 0,
    padding: '40px 20px',
    textAlign: 'center',
    color: '#667085',
    fontSize: '15px',
    background: '#fff',
    border: '1px dashed #d0d5dd',
    borderRadius: '14px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '19px',
    fontWeight: 700,
    color: '#172033',
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  countPill: {
    padding: '4px 12px',
    borderRadius: '999px',
    background: '#f2f4f7',
    color: '#475467',
    fontSize: '13px',
    fontWeight: 600,
  },
  subTitle: {
    margin: '24px 0 12px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#344054',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  statTile: {
    background: '#f9fafb',
    border: '1px solid #eaecf0',
    borderRadius: '12px',
    padding: '16px',
  },
  statTitle: {
    margin: '0 0 6px',
    fontSize: '13px',
    color: '#667085',
    fontWeight: 600,
  },
  statValue: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 750,
    color: '#172033',
  },
  statDetail: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#667085',
    lineHeight: 1.4,
  },
  rateTrack: {
    height: '8px',
    borderRadius: '999px',
    background: '#e5e7eb',
    overflow: 'hidden',
    marginTop: '10px',
  },
  rateFill: {
    height: '100%',
    borderRadius: '999px',
    background: '#12b76a',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  filterButton: {
    padding: '7px 14px',
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
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    border: '1px solid #eaecf0',
    borderRadius: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '560px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    background: '#f9fafb',
    color: '#475467',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    borderBottom: '1px solid #eaecf0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f2f4f7',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  clickableRow: {
    cursor: 'pointer',
  },
  rowLink: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#253b80',
    whiteSpace: 'nowrap',
  },
  empty: {
    margin: 0,
    padding: '28px 12px',
    textAlign: 'center',
    color: '#667085',
    fontSize: '14px',
    background: '#f9fafb',
    border: '1px dashed #d0d5dd',
    borderRadius: '12px',
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
    background: '#eef2ff',
    color: '#253b80',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  memberName: {
    margin: 0,
    fontWeight: 600,
    color: '#172033',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  financeNote: {
    margin: 0,
    padding: '20px',
    background: '#f9fafb',
    border: '1px dashed #d0d5dd',
    borderRadius: '12px',
    color: '#667085',
    fontSize: '14px',
    lineHeight: 1.6,
  },

  // Session popup
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 60,
  },
  modal: {
    width: 'min(760px, 100%)',
    maxHeight: '85vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    color: '#172033',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '18px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#172033',
  },
  modalSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#667085',
  },
  statusBlock: {
    border: '1px solid #eaecf0',
    borderRadius: '12px',
    marginBottom: '14px',
    overflow: 'hidden',
  },
  statusBlockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f9fafb',
    borderBottom: '1px solid #eaecf0',
  },
  statusBlockBody: {
    padding: '6px 16px',
  },
  statusMemberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f2f4f7',
  },
  statusReason: {
    fontSize: '13px',
    color: '#667085',
    textAlign: 'right',
  },
  statusEmpty: {
    margin: 0,
    padding: '12px 0',
    fontSize: '14px',
    color: '#667085',
  },
};

const BADGE_VARIANTS = {
  present: { background: '#ecfdf3', color: '#027a48', label: 'Present' },
  absent: { background: '#fef3f2', color: '#b42318', label: 'Absent' },
  late: { background: '#fffaeb', color: '#b54708', label: 'Late' },
  excused: { background: '#eff8ff', color: '#175cd3', label: 'Excused' },
  unrecorded: { background: '#f2f4f7', color: '#475467', label: 'Not marked' },
};

async function fetchJson(path, signal) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getGroup(data) {
  if (!data) return null;

  if (data.group && typeof data.group === 'object') {
    return data.group;
  }

  if (data.data?.group && typeof data.data.group === 'object') {
    return data.data.group;
  }

  if (data.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
}

function getMemberName(record) {
  const member =
    record?.user ||
    record?.member ||
    record?.client ||
    record;

  return (
    member?.full_name ||
    member?.fullName ||
    member?.name ||
    member?.email ||
    (member?.user_id ? `Member ${member.user_id}` : 'Unknown member')
  );
}

function getInitial(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
}

function getReason(record) {
  return (
    record?.note ||
    record?.reason ||
    record?.late_reason ||
    record?.remarks ||
    record?.comment ||
    ''
  );
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDay(day) {
  if (!day) return '';

  const date = new Date(`${day}T00:00:00`);

  if (Number.isNaN(date.getTime())) return day;

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toDay(value) {
  if (!value) return '';

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-CA');
}

function coversDay(item, day) {
  if (!day) return true;

  const start = toDay(
    item.start_date ??
    item.start_datetime ??
    item.datetime ??
    item.date
  );

  const end = toDay(item.end_date ?? item.end_datetime) || start;

  if (!start) return false;

  return start <= day && day <= end;
}

function getStatus(record) {
  const status = String(
    record?.status ||
    record?.attendance_status ||
    'unrecorded'
  ).toLowerCase();

  return BADGE_VARIANTS[status] ? status : 'unrecorded';
}

function StatusBadge({ status }) {
  const variant = BADGE_VARIANTS[status] || BADGE_VARIANTS.unrecorded;

  return (
    <span
      style={{
        ...styles.badge,
        background: variant.background,
        color: variant.color,
      }}
    >
      {variant.label}
    </span>
  );
}

function StatTile({ title, value, detail, children }) {
  return (
    <article style={styles.statTile}>
      <p style={styles.statTitle}>{title}</p>
      <p style={styles.statValue}>{value}</p>
      {detail && <p style={styles.statDetail}>{detail}</p>}
      {children}
    </article>
  );
}

function ReportSection({ id, title, count, onClose, children }) {
  return (
    <section id={id} style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>{title}</h2>

        <div style={styles.cardHeaderRight}>
          {count !== undefined && (
            <span style={styles.countPill}>{count}</span>
          )}

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {children}
    </section>
  );
}

function ReportTable({ columns, rows, emptyMessage, getKey, onRowClick }) {
  if (!rows.length) {
    return <p style={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={styles.th}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getKey ? getKey(row, index) : row.id ?? index}
              style={onRowClick ? styles.clickableRow : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={styles.td}>
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberCell({ row }) {
  const name = getMemberName(row);

  return (
    <div style={styles.memberCell}>
      <div style={styles.avatar}>{getInitial(name)}</div>
      <p style={styles.memberName}>{name}</p>
    </div>
  );
}

function SessionAttendanceModal({ session, onClose }) {
  const grouped = SESSION_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {});

  session.records.forEach((record) => {
    grouped[getStatus(record)].push(record);
  });

  const visibleStatuses = SESSION_STATUS_ORDER.filter(
    (status) => status !== 'unrecorded' || grouped.unrecorded.length > 0
  );

  return (
    <div role="presentation" onClick={onClose} style={styles.modalOverlay}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-attendance-title"
        onClick={(event) => event.stopPropagation()}
        style={styles.modal}
      >
        <div style={styles.modalHeader}>
          <div>
            <h2 id="session-attendance-title" style={styles.modalTitle}>
              {session.name}
            </h2>

            <p style={styles.modalSubtitle}>
              {formatDate(session.date)} · {session.records.length} member
              {session.records.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div style={styles.statGrid}>
          {visibleStatuses.map((status) => (
            <StatTile
              key={status}
              title={BADGE_VARIANTS[status].label}
              value={grouped[status].length}
            />
          ))}
        </div>

        {visibleStatuses.map((status) => (
          <div key={status} style={styles.statusBlock}>
            <div style={styles.statusBlockHeader}>
              <StatusBadge status={status} />
              <span style={styles.countPill}>{grouped[status].length}</span>
            </div>

            <div style={styles.statusBlockBody}>
              {grouped[status].length === 0 ? (
                <p style={styles.statusEmpty}>
                  No members marked {BADGE_VARIANTS[status].label.toLowerCase()}.
                </p>
              ) : (
                grouped[status].map((record, index) => {
                  const reason = getReason(record);

                  return (
                    <div
                      key={`${record.user_id ?? record.id ?? index}-${index}`}
                      style={styles.statusMemberRow}
                    >
                      <MemberCell row={record} />

                      {reason && (
                        <span style={styles.statusReason}>{reason}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function GroupsReport() {
  const { groupId } = useParams();
  const location = useLocation();

  const [group, setGroup] = useState(location.state?.group || null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);

  const [activeSection, setActiveSection] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setError('No group ID was provided.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function loadReport() {
      setLoading(true);
      setError('');
      setWarnings([]);

      const warningMessages = [];

      async function loadOptional(label, path, keys = []) {
        try {
          const data = await fetchJson(path, signal);
          return getArray(data, keys);
        } catch (err) {
          if (err.name === 'AbortError') throw err;

          warningMessages.push(
            `${label} could not be loaded: ${err.message}`
          );

          return [];
        }
      }

      try {
        // Load group information.
        if (location.state?.group) {
          setGroup(location.state.group);
        } else {
          const groupData = await fetchJson(
            `/groups/${encodeURIComponent(groupId)}`,
            signal
          );

          setGroup(getGroup(groupData));
        }

        // Load group members and attendance sessions.
        const [memberRows, sessionRows] = await Promise.all([
          loadOptional(
            'Membership report',
            `/user-groups/group/${encodeURIComponent(groupId)}/members`,
            ['members', 'userGroups']
          ),
          loadOptional(
            'Attendance sessions',
            `/attendance/sessions/${encodeURIComponent(groupId)}`,
            ['sessions', 'attendanceSessions']
          ),
        ]);

        if (signal.aborted) return;

        setMembers(memberRows);
        setSessions(sessionRows);

        // Load attendance records for each session.
        const attendanceResults = await Promise.all(
          sessionRows.map(async (session) => {
            const sessionId = session.id ?? session.session_id;

            if (sessionId == null) return [];

            try {
              const data = await fetchJson(
                `/attendance/sessions/${encodeURIComponent(sessionId)}/members`,
                signal
              );

              return getArray(data, ['members', 'records', 'attendance'])
                .map((record) => ({
                  ...record,
                  session_id: sessionId,
                  session_name:
                    session.session_name ||
                    session.sessionName ||
                    session.name ||
                    'Attendance session',
                  session_date:
                    session.attendance_date ||
                    session.session_date ||
                    session.date ||
                    session.created_at ||
                    session.datetime,
                }));
            } catch (err) {
              if (err.name === 'AbortError') throw err;

              warningMessages.push(
                `Attendance for session ${sessionId} could not be loaded.`
              );

              return [];
            }
          })
        );

        if (signal.aborted) return;

        setAttendance(attendanceResults.flat());

        // Load meetings for this group.
        const meetingRows = await loadOptional(
          'Meeting report',
          `/meetings?groupId=${encodeURIComponent(groupId)}`,
          ['meetings']
        );

        if (signal.aborted) return;

        setMeetings(
          meetingRows.filter((meeting) => {
            const meetingGroupId =
              meeting.group_id ??
              meeting.groupId ??
              meeting.group?.id;

            return (
              meetingGroupId == null ||
              String(meetingGroupId) === String(groupId)
            );
          })
        );

        // Load events directly for the selected group.
        // This uses GET /api/events/group/:groupId.
        const eventRows = await loadOptional(
          'Event report',
          `/events/group/${encodeURIComponent(groupId)}`,
          ['events']
        );

        if (signal.aborted) return;

        setEvents(eventRows);

        setWarnings([...new Set(warningMessages)]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load group details.');
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => controller.abort();
  }, [groupId, location.state]);

  // Attendance, events and meetings narrowed to the selected day.
  const dayAttendance = useMemo(() => {
    if (!selectedDate) return attendance;

    return attendance.filter(
      (record) => toDay(record.session_date) === selectedDate
    );
  }, [attendance, selectedDate]);

  const dayEvents = useMemo(
    () => events.filter((event) => coversDay(event, selectedDate)),
    [events, selectedDate]
  );

  const dayMeetings = useMemo(
    () => meetings.filter((meeting) => coversDay(meeting, selectedDate)),
    [meetings, selectedDate]
  );

  const attendanceSummary = useMemo(() => {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unrecorded: 0,
    };

    dayAttendance.forEach((record) => {
      summary[getStatus(record)] += 1;
    });

    const marked =
      summary.present +
      summary.absent +
      summary.late +
      summary.excused;

    const attended = summary.present + summary.late;

    const rate = marked ? Math.round((attended / marked) * 100) : 0;

    return { ...summary, marked, attended, rate };
  }, [dayAttendance]);

  // One row per session for the selected period.
  const sessionBreakdown = useMemo(() => {
    const map = new Map();

    dayAttendance.forEach((record) => {
      const key = String(record.session_id);

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: record.session_name,
          date: record.session_date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          unrecorded: 0,
        });
      }

      map.get(key)[getStatus(record)] += 1;
    });

    return [...map.values()];
  }, [dayAttendance]);

  // The session currently open in the popup, with its own member records.
  const selectedSession = useMemo(() => {
    if (selectedSessionId == null) return null;

    const records = attendance.filter(
      (record) => String(record.session_id) === String(selectedSessionId)
    );

    if (!records.length) return null;

    return {
      id: selectedSessionId,
      name: records[0].session_name,
      date: records[0].session_date,
      records,
    };
  }, [attendance, selectedSessionId]);

  // Close the popup with the Escape key.
  useEffect(() => {
    if (selectedSessionId == null) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedSessionId(null);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSessionId]);

  const filteredAttendance = useMemo(() => {
    if (attendanceFilter === 'all') return dayAttendance;

    return dayAttendance.filter(
      (record) => getStatus(record) === attendanceFilter
    );
  }, [dayAttendance, attendanceFilter]);

  function toggleSection(id) {
    setActiveSection((current) => (current === id ? null : id));
  }

  function getCardValue(id) {
    if (id === 'attendance') return attendanceSummary.attended;
    if (id === 'events') return dayEvents.length;
    if (id === 'meetings') return dayMeetings.length;
    if (id === 'membership') return members.length;

    return '—';
  }

  function getCardNote(id) {
    if (id === 'attendance') {
      return `attended, of ${attendanceSummary.marked} marked`;
    }

    if (id === 'events') return dayEvents.length === 1 ? 'event' : 'events';

    if (id === 'meetings') {
      return dayMeetings.length === 1 ? 'meeting' : 'meetings';
    }

    if (id === 'membership') {
      return members.length === 1 ? 'member' : 'members';
    }

    return 'Not connected yet';
  }

  if (loading) {
    return (
      <div className="administration-section-page">
        <div style={styles.page}>
          <div style={styles.loadingBox}>Loading group report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="administration-section-page">
        <div style={styles.page}>
          <div style={styles.headerCard}>
            <div>
              <p style={styles.eyebrow}>Administration</p>
              <h1 style={styles.pageTitle}>Group report</h1>
            </div>
          </div>

          <div role="alert" style={styles.errorBox}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="administration-section-page">
      <div style={styles.page}>
        <header style={styles.headerCard}>
          <div>
            <p style={styles.eyebrow}>Administration</p>

            <h1 style={styles.pageTitle}>
              {group?.name ? `${group.name} report` : 'Group report'}
            </h1>

            {(group?.type || group?.location) && (
              <div style={styles.headerMeta}>
                {group?.type && (
                  <span style={styles.typeBadge}>{group.type}</span>
                )}

                {group?.location && (
                  <span style={styles.locationText}>
                    {group.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {warnings.length > 0 && (
          <div role="status" style={styles.warning}>
            <strong>Some report data could not be loaded.</strong>

            <ul style={styles.warningList}>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* DATE FILTER */}
        <div style={styles.dateBar}>
          <div style={styles.dateField}>
            <label htmlFor="report-date" style={styles.dateLabel}>
              Filter by date
            </label>

            <input
              id="report-date"
              type="date"
              style={styles.dateInput}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          {selectedDate && (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setSelectedDate('')}
            >
              All dates
            </button>
          )}

          <p style={styles.dateHint}>
            {selectedDate
              ? `Showing attendance, events and meetings for ${formatDay(selectedDate)}.`
              : 'Showing all dates. Pick a day to see its attendance, events and meetings.'}
          </p>
        </div>

        <p style={styles.sectionLabel}>Reports</p>

        <div style={styles.overviewGrid} aria-label="Group report categories">
          {reportCards.map((card) => {
            const isFinance = card.id === 'finance';
            const isActive = activeSection === card.id;

            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={isActive}
                style={{
                  ...styles.overviewCard,
                  ...(isActive ? styles.overviewCardActive : {}),
                  ...(isFinance ? styles.overviewCardDisabled : {}),
                }}
                onClick={() => {
                  if (!isFinance) toggleSection(card.id);
                }}
                disabled={isFinance}
              >
                <span style={styles.overviewTitle}>{card.title}</span>

                <span style={styles.overviewValue}>
                  {getCardValue(card.id)}
                </span>

                <span style={styles.overviewNote}>
                  {getCardNote(card.id)}
                </span>

                {!isFinance && (
                  <span style={styles.overviewLink}>
                    {isActive ? 'Hide report' : 'View report →'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!activeSection && (
          <p style={styles.placeholder}>
            Select a report above to view its details.
          </p>
        )}

        {activeSection === 'attendance' && (
          <ReportSection
            id="attendance"
            title="Attendance Report"
            count={`${filteredAttendance.length} record${
              filteredAttendance.length === 1 ? '' : 's'
            }`}
            onClose={() => setActiveSection(null)}
          >
            <div style={styles.statGrid}>
              <StatTile
                title="Total attended"
                value={attendanceSummary.attended}
                detail={`Present and late, out of ${attendanceSummary.marked} marked`}
              />
              <StatTile title="Present" value={attendanceSummary.present} />
              <StatTile title="Absent" value={attendanceSummary.absent} />
              <StatTile title="Late" value={attendanceSummary.late} />
              <StatTile title="Excused" value={attendanceSummary.excused} />

              {attendanceSummary.unrecorded > 0 && (
                <StatTile
                  title="Not marked"
                  value={attendanceSummary.unrecorded}
                />
              )}

              <StatTile
                title="Attendance rate"
                value={`${attendanceSummary.rate}%`}
              >
                <div style={styles.rateTrack}>
                  <div
                    style={{
                      ...styles.rateFill,
                      width: `${attendanceSummary.rate}%`,
                    }}
                  />
                </div>
              </StatTile>
            </div>

            <h3 style={{ ...styles.subTitle, marginTop: 0 }}>
              {selectedDate ? 'Sessions on this day' : 'Sessions'}
            </h3>

            <ReportTable
              columns={[
                {
                  key: 'name',
                  label: 'Session',
                  render: (row) => <strong>{row.name}</strong>,
                },
                {
                  key: 'date',
                  label: 'Date',
                  render: (row) => formatDate(row.date),
                },
                { key: 'present', label: 'Present' },
                { key: 'absent', label: 'Absent' },
                { key: 'late', label: 'Late' },
                { key: 'excused', label: 'Excused' },
                {
                  key: 'view',
                  label: 'Details',
                  render: () => <span style={styles.rowLink}>View →</span>,
                },
              ]}
              rows={sessionBreakdown}
              getKey={(row) => row.id}
              onRowClick={(row) => setSelectedSessionId(row.id)}
              emptyMessage={
                selectedDate
                  ? 'No attendance sessions were held on this date.'
                  : 'No attendance sessions were found for this group.'
              }
            />

            <h3 style={styles.subTitle}>Members</h3>

            <div style={styles.filterRow}>
              {ATTENDANCE_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  style={{
                    ...styles.filterButton,
                    ...(attendanceFilter === option.value
                      ? styles.filterButtonActive
                      : {}),
                  }}
                  onClick={() => setAttendanceFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <ReportTable
              columns={[
                {
                  key: 'member',
                  label: 'Member',
                  render: (row) => <MemberCell row={row} />,
                },
                {
                  key: 'session_name',
                  label: 'Session',
                  render: (row) => row.session_name || '—',
                },
                {
                  key: 'session_date',
                  label: 'Session date',
                  render: (row) => formatDate(row.session_date),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <StatusBadge status={getStatus(row)} />,
                },
                {
                  key: 'note',
                  label: 'Reason',
                  render: (row) => getReason(row) || '—',
                },
              ]}
              rows={filteredAttendance}
              getKey={(row, index) =>
                `${row.session_id}-${row.user_id ?? row.id ?? index}`
              }
              emptyMessage={
                dayAttendance.length === 0
                  ? 'No attendance records were found for this selection.'
                  : 'No records match the selected status.'
              }
            />
          </ReportSection>
        )}

        {activeSection === 'events' && (
          <ReportSection
            id="events"
            title="Event Report"
            count={`${dayEvents.length} event${
              dayEvents.length === 1 ? '' : 's'
            }`}
            onClose={() => setActiveSection(null)}
          >
            <ReportTable
              columns={[
                {
                  key: 'title',
                  label: 'Event',
                  render: (row) => (
                    <strong>{row.title || row.name || 'Untitled event'}</strong>
                  ),
                },
                {
                  key: 'datetime',
                  label: 'Date',
                  render: (row) =>
                    formatDate(
                      row.start_date ||
                        row.datetime ||
                        row.event_date ||
                        row.date
                    ),
                },
                {
                  key: 'event_location',
                  label: 'Location',
                  render: (row) =>
                    row.event_location || row.location || '—',
                },
              ]}
              rows={dayEvents}
              getKey={(row, index) => row.id ?? index}
              emptyMessage={
                selectedDate
                  ? 'No events were found on this date.'
                  : 'No events linked to this group were found.'
              }
            />
          </ReportSection>
        )}

        {activeSection === 'meetings' && (
          <ReportSection
            id="meetings"
            title="Meeting Report"
            count={`${dayMeetings.length} meeting${
              dayMeetings.length === 1 ? '' : 's'
            }`}
            onClose={() => setActiveSection(null)}
          >
            <ReportTable
              columns={[
                {
                  key: 'title',
                  label: 'Meeting',
                  render: (row) => (
                    <strong>
                      {row.title || row.name || 'Untitled meeting'}
                    </strong>
                  ),
                },
                {
                  key: 'datetime',
                  label: 'Date',
                  render: (row) =>
                    formatDate(
                      row.start_date ||
                        row.datetime ||
                        row.meeting_date ||
                        row.date
                    ),
                },
                {
                  key: 'location',
                  label: 'Location',
                  render: (row) => row.location || row.venue || '—',
                },
              ]}
              rows={dayMeetings}
              getKey={(row, index) => row.id ?? index}
              emptyMessage={
                selectedDate
                  ? 'No meetings were found on this date.'
                  : 'No meetings were found for this group.'
              }
            />
          </ReportSection>
        )}

        {activeSection === 'membership' && (
          <ReportSection
            id="membership"
            title="Membership Report"
            count={`${members.length} member${
              members.length === 1 ? '' : 's'
            }`}
            onClose={() => setActiveSection(null)}
          >
            <ReportTable
              columns={[
                {
                  key: 'member',
                  label: 'Member',
                  render: (row) => <MemberCell row={row} />,
                },
                {
                  key: 'email',
                  label: 'Email',
                  render: (row) =>
                    row.email || row.user?.email || row.member?.email || '—',
                },
                {
                  key: 'phone',
                  label: 'Phone',
                  render: (row) =>
                    row.phone_number ||
                    row.phone ||
                    row.user?.phone_number ||
                    '—',
                },
              ]}
              rows={members}
              getKey={(row, index) => row.id ?? row.user_id ?? index}
              emptyMessage="No group members were found."
            />
          </ReportSection>
        )}
      </div>

      {selectedSession && (
        <SessionAttendanceModal
          session={selectedSession}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}