import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const ATTENDANCE_ENDPOINT = `${API_BASE}/api/attendance/sessions`;

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

// Late and excused records must include a reason.
const NOTE_REQUIRED_STATUSES = ['late', 'excused'];
const MAX_NOTE_LENGTH = 500;

const styles = {
  page: {
    padding: '24px',
    color: '#172033',
    background: '#f8fafc',
    minHeight: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 750,
  },
  subtitle: {
    color: '#64748b',
    marginTop: '8px',
  },
  button: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: '#1d4ed8',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    padding: '9px 13px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
    color: '#334155',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    padding: '9px 13px',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    background: '#fff',
    color: '#b91c1c',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  countButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: '#1d4ed8',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px',
  },
  statLabel: {
    color: '#64748b',
    fontSize: '13px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '25px',
    fontWeight: 750,
    margin: 0,
  },
  section: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '13px',
    color: '#475569',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
    color: '#172033',
    fontSize: '14px',
  },
  noteInput: {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '8px',
    padding: '8px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    background: '#fff',
    color: '#172033',
    fontSize: '13px',
    minWidth: '220px',
  },
  noteInputError: {
    border: '1px solid #f87171',
    background: '#fef2f2',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  filterButtonActive: {
    background: '#1d4ed8',
    border: '1px solid #1d4ed8',
    color: '#fff',
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '650px',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    color: '#64748b',
    fontSize: '12px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '13px 12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
    verticalAlign: 'top',
  },
  error: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    marginBottom: '16px',
  },
  success: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    marginBottom: '16px',
  },
  notice: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
    fontSize: '14px',
  },
  muted: {
    color: '#64748b',
    fontSize: '14px',
  },
  statusSelect: {
    padding: '8px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    background: '#fff',
    minWidth: '125px',
  },
  statusBadge: {
    display: 'inline-block',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 700,
  },
  badgePresent: { background: '#ecfdf3', color: '#027a48' },
  badgeAbsent: { background: '#fef3f2', color: '#b42318' },
  badgeLate: { background: '#fffaeb', color: '#b54708' },
  badgeExcused: { background: '#eff8ff', color: '#175cd3' },
  badgeUnmarked: { background: '#f2f4f7', color: '#475467' },
  pastTag: {
    display: 'inline-block',
    marginLeft: '8px',
    borderRadius: '999px',
    padding: '2px 8px',
    background: '#f2f4f7',
    color: '#475467',
    fontSize: '11px',
    fontWeight: 700,
  },
  qrSection: {
    background: '#fff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  qrLayout: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    flexWrap: 'wrap',
  },
  qrImage: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrDetails: {
    flex: '1 1 240px',
    minWidth: 0,
  },
};

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getErrorMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getSessionId(session) {
  return session?.id ?? session?.session_id ?? null;
}

function getSessionName(session) {
  return (
    session?.session_name ||
    session?.sessionName ||
    session?.name ||
    'Attendance session'
  );
}

// A session dated before today is closed for marking.
function isPastSession(session) {
  if (!session) return false;

  if (typeof session.is_past === 'boolean') return session.is_past;

  const date = String(
    session.attendance_date || session.attendanceDate || ''
  ).slice(0, 10);

  return Boolean(date) && date < getToday();
}

function getMemberId(member) {
  return (
    member?.user_id ??
    member?.userId ??
    member?.id ??
    null
  );
}

function getMemberName(member) {
  return (
    member?.full_name ||
    member?.fullName ||
    member?.name ||
    member?.member_name ||
    member?.email ||
    `Member #${getMemberId(member) ?? 'unknown'}`
  );
}

// The status stored in the database, or null if none was saved.
function getSavedStatus(member) {
  const status = String(
    member?.status ?? member?.attendance_status ?? ''
  ).toLowerCase();

  return STATUS_OPTIONS.some((option) => option.value === status)
    ? status
    : null;
}

function getMemberStatus(member) {
  return getSavedStatus(member) || 'absent';
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function AttendanceStatusBadge({ status }) {
  const variants = {
    present: { style: styles.badgePresent, label: 'Present' },
    absent: { style: styles.badgeAbsent, label: 'Absent' },
    late: { style: styles.badgeLate, label: 'Late' },
    excused: { style: styles.badgeExcused, label: 'Excused' },
    unmarked: { style: styles.badgeUnmarked, label: 'Not marked' },
  };

  const variant = variants[status] || variants.unmarked;

  return (
    <span style={{ ...styles.statusBadge, ...variant.style }}>
      {variant.label}
    </span>
  );
}

export default function FellowshipAttendancePage({ groupId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSession, setSavingSession] = useState(false);

  const [sessionName, setSessionName] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(getToday());

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [selectedSession, setSelectedSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingRecords, setSavingRecords] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [showNoteErrors, setShowNoteErrors] = useState(false);

  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [clearingUserId, setClearingUserId] = useState(null);

  // QR code returned by the backend when a session is created.
  const [qrDetails, setQrDetails] = useState(null);
  const [qrSecondsRemaining, setQrSecondsRemaining] = useState(0);

  const panelRef = useRef(null);

  const validGroupId =
    groupId !== undefined &&
    groupId !== null &&
    String(groupId).trim() !== '' &&
    Number.isSafeInteger(Number(groupId)) &&
    Number(groupId) > 0;

  // Past sessions are view-only.
  const readOnly = selectedSession ? isPastSession(selectedSession) : false;
  const selectedSessionId = getSessionId(selectedSession);

  // Update the QR countdown until its token expires.
  useEffect(() => {
    if (!qrDetails?.expiresAt) {
      setQrSecondsRemaining(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((qrDetails.expiresAt - Date.now()) / 1000)
      );

      setQrSecondsRemaining(remaining);
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [qrDetails]);

  // Scroll to the attendance panel when a session is opened.
  useEffect(() => {
    if (selectedSessionId && panelRef.current) {
      panelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [selectedSessionId, statusFilter]);

  const loadSessions = useCallback(async () => {
    if (!validGroupId) {
      setSessions([]);
      setLoading(false);
      setError('No fellowship group is assigned to your account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/${encodeURIComponent(groupId)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to load attendance sessions.')
        );
      }

      setSessions(
        getArray(data, ['sessions', 'attendanceSessions', 'records'])
      );
    } catch (err) {
      console.error('Load attendance sessions error:', err);
      setError(err.message || 'Failed to load attendance sessions.');
    } finally {
      setLoading(false);
    }
  }, [groupId, validGroupId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!validGroupId) {
      setError('Your fellowship group could not be identified.');
      return;
    }

    if (!sessionName.trim()) {
      setError('Enter a name for the attendance session.');
      return;
    }

    if (!attendanceDate) {
      setError('Select an attendance date.');
      return;
    }

    if (attendanceDate < getToday()) {
      setError('Attendance sessions cannot be created for past dates.');
      return;
    }

    setSavingSession(true);

    try {
      const response = await fetch(ATTENDANCE_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          groupId: Number(groupId),
          sessionName: sessionName.trim(),
          attendanceDate,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to create the attendance session.')
        );
      }

      const createdName = sessionName.trim();
      const createdDate = attendanceDate;

      setSessionName('');

      if (data?.qrToken) {
        const expirySeconds = Number(data.qrExpiresInSeconds) || 900;

        setQrDetails({
          token: data.qrToken,
          sessionName:
            data.session?.session_name ||
            data.session?.sessionName ||
            data.session?.name ||
            createdName,
          attendanceDate:
            data.session?.attendance_date ||
            data.session?.attendanceDate ||
            createdDate,
          sessionId: getSessionId(data.session),
          expiresAt: Date.now() + expirySeconds * 1000,
        });

        setMessage(
          'Attendance session created. Display the QR code for members to scan.'
        );
      } else {
        setQrDetails(null);
        setMessage(
          'The attendance session was created, but the server did not return a QR token. Check the backend createSession response.'
        );
      }

      await loadSessions();
    } catch (err) {
      console.error('Create attendance session error:', err);
      setError(err.message || 'Failed to create attendance session.');
    } finally {
      setSavingSession(false);
    }
  };

  // Opens a session. Pass a status to show only members with that status.
  const openSession = async (session, initialFilter = 'all') => {
    const sessionId = getSessionId(session);

    if (!sessionId) {
      setError('This attendance session has no valid ID.');
      return;
    }

    setError('');
    setMessage('');
    setSelectedSession(session);
    setMembers([]);
    setAttendanceStatuses({});
    setAttendanceNotes({});
    setShowNoteErrors(false);
    setMemberSearch('');
    setStatusFilter(initialFilter);
    setLoadingMembers(true);

    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/${encodeURIComponent(sessionId)}/members`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to load fellowship members.')
        );
      }

      const memberRows = getArray(data, ['members', 'records', 'users']);

      if (data?.session) {
        setSelectedSession((previous) => ({
          ...previous,
          ...data.session,
        }));
      }

      setMembers(memberRows);

      const initialStatuses = {};
      const initialNotes = {};

      memberRows.forEach((member) => {
        const id = getMemberId(member);

        if (id !== null && id !== undefined) {
          initialStatuses[String(id)] = getMemberStatus(member);
          initialNotes[String(id)] = member.note || '';
        }
      });

      setAttendanceStatuses(initialStatuses);
      setAttendanceNotes(initialNotes);
    } catch (err) {
      console.error('Load session members error:', err);
      setError(err.message || 'Failed to load session members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const changeMemberStatus = (userId, status) => {
    setAttendanceStatuses((previous) => ({
      ...previous,
      [String(userId)]: status,
    }));
  };

  const changeMemberNote = (userId, note) => {
    setAttendanceNotes((previous) => ({
      ...previous,
      [String(userId)]: note,
    }));
  };

  const saveAttendance = async () => {
    const sessionId = getSessionId(selectedSession);

    if (!sessionId) {
      setError('Select a valid attendance session first.');
      return;
    }

    if (readOnly) {
      setError('Attendance for past sessions cannot be changed.');
      return;
    }

    // Late and excused records need a reason.
    const missingNotes = members.filter((member) => {
      const id = String(getMemberId(member));
      const status = attendanceStatuses[id] || 'absent';

      return (
        NOTE_REQUIRED_STATUSES.includes(status) &&
        !(attendanceNotes[id] || '').trim()
      );
    });

    if (missingNotes.length > 0) {
      const names = missingNotes
        .slice(0, 3)
        .map((member) => getMemberName(member))
        .join(', ');

      setShowNoteErrors(true);
      setStatusFilter('all');
      setMessage('');
      setError(
        `Add a reason for every member marked late or excused. Missing: ${names}${
          missingNotes.length > 3 ? ` and ${missingNotes.length - 3} more` : ''
        }.`
      );
      return;
    }

    const records = members
      .map((member) => {
        const userId = getMemberId(member);

        if (userId === null || userId === undefined) return null;

        const status = attendanceStatuses[String(userId)] || 'absent';

        return {
          userId: Number(userId),
          status,
          note: NOTE_REQUIRED_STATUSES.includes(status)
            ? (attendanceNotes[String(userId)] || '').trim()
            : null,
        };
      })
      .filter(Boolean);

    setError('');
    setMessage('');
    setSavingRecords(true);

    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/${encodeURIComponent(sessionId)}/records`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ records }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to save attendance records.')
        );
      }

      setMessage('Attendance records saved successfully.');
      setShowNoteErrors(false);

      // Mark every member as having a saved record.
      setMembers((previous) =>
        previous.map((member) => {
          const id = String(getMemberId(member));
          const status = attendanceStatuses[id] || 'absent';

          return {
            ...member,
            attendance_record_id: member.attendance_record_id ?? true,
            status,
            note: NOTE_REQUIRED_STATUSES.includes(status)
              ? (attendanceNotes[id] || '').trim()
              : null,
          };
        })
      );

      await loadSessions();
    } catch (err) {
      console.error('Save attendance records error:', err);
      setError(err.message || 'Failed to save attendance records.');
    } finally {
      setSavingRecords(false);
    }
  };

  // Delete a whole session and its records.
  const handleDeleteSession = async (session) => {
    const sessionId = getSessionId(session);

    if (!sessionId) {
      setError('This attendance session has no valid ID.');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${getSessionName(session)}" and all of its attendance records?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setDeletingSessionId(String(sessionId));

    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/${encodeURIComponent(sessionId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to delete the attendance session.')
        );
      }

      if (String(getSessionId(selectedSession)) === String(sessionId)) {
        setSelectedSession(null);
        setMembers([]);
        setAttendanceStatuses({});
        setAttendanceNotes({});
      }

      if (
        qrDetails?.sessionId &&
        String(qrDetails.sessionId) === String(sessionId)
      ) {
        setQrDetails(null);
        setQrSecondsRemaining(0);
      }

      setMessage('Attendance session deleted successfully.');
      await loadSessions();
    } catch (err) {
      console.error('Delete attendance session error:', err);
      setError(err.message || 'Failed to delete the attendance session.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Remove one member's saved attendance record for the open session.
  const handleClearRecord = async (member) => {
    const sessionId = getSessionId(selectedSession);
    const userId = getMemberId(member);

    if (!sessionId || userId === null || userId === undefined) return;

    if (readOnly) {
      setError('Attendance for past sessions cannot be changed.');
      return;
    }

    const confirmed = window.confirm(
      `Remove the saved attendance record for ${getMemberName(member)}?`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setClearingUserId(String(userId));

    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}/${encodeURIComponent(
          sessionId
        )}/records/${encodeURIComponent(userId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to delete the attendance record.')
        );
      }

      setMembers((previous) =>
        previous.map((item) =>
          String(getMemberId(item)) === String(userId)
            ? {
                ...item,
                attendance_record_id: null,
                status: null,
                note: null,
              }
            : item
        )
      );

      changeMemberStatus(userId, 'absent');
      changeMemberNote(userId, '');

      setMessage('Attendance record removed.');
      await loadSessions();
    } catch (err) {
      console.error('Delete attendance record error:', err);
      setError(err.message || 'Failed to delete the attendance record.');
    } finally {
      setClearingUserId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return sessions.filter((session) => {
      const name = String(
        session.session_name || session.sessionName || session.name || ''
      ).toLowerCase();

      const date = String(
        session.attendance_date || session.attendanceDate || ''
      ).slice(0, 10);

      return (
        (!search || name.includes(search)) &&
        (!dateFilter || date === dateFilter)
      );
    });
  }, [sessions, searchTerm, dateFilter]);

  const stats = useMemo(() => {
    return sessions.reduce(
      (result, session) => {
        result.total += 1;
        result.present += Number(session.present || 0);
        result.absent += Number(session.absent || 0);
        result.late += Number(session.late || 0);
        result.excused += Number(session.excused || 0);
        return result;
      },
      { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [sessions]);

  // The status shown for a member: saved status in a past session
  // (or "unmarked"), the current selection in an open session.
  const getEffectiveStatus = useCallback(
    (member) => {
      if (readOnly) return getSavedStatus(member) || 'unmarked';

      return attendanceStatuses[String(getMemberId(member))] || 'absent';
    },
    [readOnly, attendanceStatuses]
  );

  // Counts for the open session, used on the filter buttons.
  const memberStatusCounts = useMemo(() => {
    const counts = {
      all: members.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    };

    members.forEach((member) => {
      const status = getEffectiveStatus(member);

      if (counts[status] !== undefined) counts[status] += 1;
    });

    return counts;
  }, [members, getEffectiveStatus]);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...STATUS_OPTIONS,
      ...(readOnly ? [{ value: 'unmarked', label: 'Not marked' }] : []),
    ],
    [readOnly]
  );

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return members.filter((member) => {
      const status = getEffectiveStatus(member);

      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSearch =
        !search || getMemberName(member).toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [members, memberSearch, statusFilter, getEffectiveStatus]);

  const closeSession = () => {
    setSelectedSession(null);
    setMembers([]);
    setAttendanceStatuses({});
    setAttendanceNotes({});
    setShowNoteErrors(false);
    setStatusFilter('all');
    setError('');
    setMessage('');
  };

  const hideQRCode = () => {
    setQrDetails(null);
    setQrSecondsRemaining(0);
  };

  // A clickable count in the sessions table.
  const renderCount = (session, status) => {
    const value = Number(session[status] || 0);

    if (value === 0) return <span style={styles.muted}>0</span>;

    return (
      <button
        type="button"
        style={styles.countButton}
        onClick={() => openSession(session, status)}
        title={`Show ${status} members`}
      >
        {value}
      </button>
    );
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Fellowship Attendance</h1>
          <p style={styles.subtitle}>
            Create attendance sessions, display QR codes, and record
            fellowship members' attendance.
          </p>
        </div>

        <button
          type="button"
          style={{
            ...styles.secondaryButton,
            ...(loading ? styles.disabledButton : {}),
          }}
          onClick={loadSessions}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={styles.success}>
          {message}
        </div>
      )}

      {/* QR CODE DISPLAY */}
      {qrDetails && (
        <section style={styles.qrSection}>
          <div style={styles.toolbar}>
            <div>
              <h2 style={styles.sectionTitle}>
                Attendance QR Code
              </h2>
              <p style={styles.muted}>
                Members can scan this code using the HGBMI attendance scanner
                while signed in to their accounts.
              </p>
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={hideQRCode}
            >
              Hide QR code
            </button>
          </div>

          <div style={styles.qrLayout}>
            <div style={styles.qrImage}>
              {qrSecondsRemaining > 0 ? (
                <QRCodeSVG
                  value={qrDetails.token}
                  size={240}
                  level="M"
                  includeMargin
                  title="HGBMI attendance check-in QR code"
                />
              ) : (
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#b91c1c',
                    background: '#fef2f2',
                    padding: '16px',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <strong>QR code expired</strong>
                    <p style={{ fontSize: '13px' }}>
                      Create a new attendance session to obtain another QR
                      code. A refresh-token endpoint can be added to avoid
                      creating another session.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.qrDetails}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                {qrDetails.sessionName}
              </h3>

              <p style={styles.muted}>
                Attendance date:{' '}
                <strong>{formatDate(qrDetails.attendanceDate)}</strong>
              </p>

              {qrDetails.sessionId && (
                <p style={styles.muted}>
                  Session ID: <strong>{qrDetails.sessionId}</strong>
                </p>
              )}

              <p style={styles.muted}>
                QR token expires in:
              </p>

              <p
                style={{
                  fontSize: '28px',
                  fontWeight: 750,
                  margin: '0 0 16px',
                  color: qrSecondsRemaining > 0 ? '#1d4ed8' : '#b91c1c',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {qrSecondsRemaining > 0
                  ? formatCountdown(qrSecondsRemaining)
                  : 'Expired'}
              </p>

              <p style={styles.muted}>
                Keep this QR code visible on your screen for members to scan.
                The QR code contains a temporary attendance token.
              </p>

              <a
                href="/attendance-qr-scanner"
                style={styles.button}
              >
                Open attendance scanner
              </a>
            </div>
          </div>
        </section>
      )}

      {!validGroupId ? (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fellowship unavailable</h2>
          <p style={styles.muted}>
            Your account does not currently have an identifiable fellowship
            group. Check that your user profile includes the correct group
            assignment.
          </p>
        </section>
      ) : (
        <>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.statLabel}>Total sessions</div>
              <p style={styles.statValue}>{stats.total}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.statLabel}>Present records</div>
              <p style={styles.statValue}>{stats.present}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.statLabel}>Absent records</div>
              <p style={styles.statValue}>{stats.absent}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.statLabel}>Late records</div>
              <p style={styles.statValue}>{stats.late}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.statLabel}>Excused records</div>
              <p style={styles.statValue}>{stats.excused}</p>
            </div>
          </div>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Create attendance session
            </h2>

            <form onSubmit={handleCreateSession}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="sessionName">
                    Session name
                  </label>
                  <input
                    id="sessionName"
                    style={styles.input}
                    value={sessionName}
                    onChange={(event) => setSessionName(event.target.value)}
                    placeholder="e.g. Sunday Fellowship"
                    maxLength={150}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="attendanceDate">
                    Attendance date
                  </label>
                  <input
                    id="attendanceDate"
                    type="date"
                    style={styles.input}
                    value={attendanceDate}
                    min={getToday()}
                    onChange={(event) => setAttendanceDate(event.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...(savingSession ? styles.disabledButton : {}),
                  }}
                  disabled={savingSession}
                >
                  {savingSession ? 'Creating...' : 'Create session and QR'}
                </button>
              </div>
            </form>
          </section>

          <section style={styles.section}>
            <div style={styles.toolbar}>
              <div>
                <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
                  Attendance sessions
                </h2>
                <p style={{ ...styles.muted, margin: '6px 0 0' }}>
                  Click a number to see the members in that group.
                </p>
              </div>

              <div style={styles.formGrid}>
                <input
                  type="search"
                  aria-label="Search sessions"
                  style={styles.input}
                  placeholder="Search session..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <input
                  type="date"
                  aria-label="Filter by attendance date"
                  style={styles.input}
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <p style={styles.muted}>
                Loading attendance sessions...
              </p>
            ) : filteredSessions.length === 0 ? (
              <p style={styles.muted}>
                No attendance sessions found. Create your first session above.
              </p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Session</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Present</th>
                      <th style={styles.th}>Absent</th>
                      <th style={styles.th}>Late</th>
                      <th style={styles.th}>Excused</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSessions.map((session, index) => {
                      const sessionId = getSessionId(session);
                      const past = isPastSession(session);
                      const isDeleting =
                        deletingSessionId !== null &&
                        String(sessionId) === deletingSessionId;

                      return (
                        <tr key={sessionId ?? index}>
                          <td style={styles.td}>
                            <strong>{getSessionName(session)}</strong>
                            {past && <span style={styles.pastTag}>Past</span>}
                          </td>

                          <td style={styles.td}>
                            {formatDate(
                              session.attendance_date ||
                                session.attendanceDate
                            )}
                          </td>

                          <td style={styles.td}>
                            {renderCount(session, 'present')}
                          </td>

                          <td style={styles.td}>
                            {renderCount(session, 'absent')}
                          </td>

                          <td style={styles.td}>
                            {renderCount(session, 'late')}
                          </td>

                          <td style={styles.td}>
                            {renderCount(session, 'excused')}
                          </td>

                          <td style={styles.td}>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => openSession(session)}
                              >
                                {past ? 'View attendance' : 'Mark attendance'}
                              </button>

                              <button
                                type="button"
                                style={{
                                  ...styles.dangerButton,
                                  ...(isDeleting || deletingSessionId !== null
                                    ? styles.disabledButton
                                    : {}),
                                }}
                                onClick={() => handleDeleteSession(session)}
                                disabled={deletingSessionId !== null}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete session'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedSession && (
            <section style={styles.section} ref={panelRef}>
              <div style={styles.toolbar}>
                <div>
                  <h2 style={styles.sectionTitle}>
                    {readOnly ? 'Attendance' : 'Mark attendance'}:{' '}
                    {getSessionName(selectedSession)}
                  </h2>

                  <p style={styles.muted}>
                    Date:{' '}
                    {formatDate(
                      selectedSession.attendance_date ||
                        selectedSession.attendanceDate
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeSession}
                >
                  Close
                </button>
              </div>

              {readOnly && (
                <div style={styles.notice}>
                  This session is in the past. Attendance can be viewed but
                  can no longer be changed.
                </div>
              )}

              {loadingMembers ? (
                <p style={styles.muted}>
                  Loading fellowship members...
                </p>
              ) : members.length === 0 ? (
                <p style={styles.muted}>
                  No members were returned for this session. Check the
                  session-members endpoint and the fellowship membership
                  records.
                </p>
              ) : (
                <>
                  <div style={styles.filterRow}>
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        style={{
                          ...styles.secondaryButton,
                          ...(statusFilter === option.value
                            ? styles.filterButtonActive
                            : {}),
                        }}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        {option.label} ({memberStatusCounts[option.value]})
                      </button>
                    ))}
                  </div>

                  <div style={styles.toolbar}>
                    <input
                      type="search"
                      style={{ ...styles.input, maxWidth: '350px' }}
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                    />

                    {!readOnly && (
                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          ...(savingRecords ? styles.disabledButton : {}),
                        }}
                        onClick={saveAttendance}
                        disabled={savingRecords}
                      >
                        {savingRecords ? 'Saving...' : 'Save attendance'}
                      </button>
                    )}
                  </div>

                  {filteredMembers.length === 0 ? (
                    <p style={styles.muted}>
                      No members match the selected status or search.
                    </p>
                  ) : readOnly ? (
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>#</th>
                            <th style={styles.th}>Member</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Reason</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredMembers.map((member, index) => {
                            const userId = getMemberId(member);
                            const status = getEffectiveStatus(member);
                            const needsNote =
                              NOTE_REQUIRED_STATUSES.includes(status);

                            return (
                              <tr key={userId ?? index}>
                                <td style={styles.td}>{index + 1}</td>

                                <td style={styles.td}>
                                  {getMemberName(member)}
                                </td>

                                <td style={styles.td}>
                                  <AttendanceStatusBadge status={status} />
                                </td>

                                <td style={styles.td}>
                                  {needsNote ? (
                                    member.note || (
                                      <span style={styles.muted}>
                                        No reason recorded
                                      </span>
                                    )
                                  ) : (
                                    <span style={styles.muted}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>#</th>
                            <th style={styles.th}>Member</th>
                            <th style={styles.th}>Attendance status</th>
                            <th style={styles.th}>Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredMembers.map((member, index) => {
                            const userId = getMemberId(member);
                            const idKey = String(userId);
                            const status =
                              attendanceStatuses[idKey] || 'absent';
                            const needsNote =
                              NOTE_REQUIRED_STATUSES.includes(status);
                            const note = attendanceNotes[idKey] || '';
                            const hasSavedRecord =
                              member.attendance_record_id !== null &&
                              member.attendance_record_id !== undefined;
                            const isClearing = clearingUserId === idKey;

                            return (
                              <tr key={userId ?? index}>
                                <td style={styles.td}>{index + 1}</td>

                                <td style={styles.td}>
                                  {getMemberName(member)}
                                </td>

                                <td style={styles.td}>
                                  <select
                                    style={styles.statusSelect}
                                    value={status}
                                    onChange={(event) =>
                                      changeMemberStatus(
                                        userId,
                                        event.target.value
                                      )
                                    }
                                    aria-label={`Attendance status for ${getMemberName(member)}`}
                                  >
                                    {STATUS_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  {needsNote && (
                                    <input
                                      type="text"
                                      style={{
                                        ...styles.noteInput,
                                        ...(showNoteErrors && !note.trim()
                                          ? styles.noteInputError
                                          : {}),
                                      }}
                                      value={note}
                                      onChange={(event) =>
                                        changeMemberNote(
                                          userId,
                                          event.target.value
                                        )
                                      }
                                      placeholder={
                                        status === 'excused'
                                          ? 'Reason for excuse (required)'
                                          : 'Reason for lateness (required)'
                                      }
                                      maxLength={MAX_NOTE_LENGTH}
                                      aria-label={`Reason for ${getMemberName(member)}`}
                                    />
                                  )}
                                </td>

                                <td style={styles.td}>
                                  {hasSavedRecord ? (
                                    <button
                                      type="button"
                                      style={{
                                        ...styles.dangerButton,
                                        ...(clearingUserId !== null
                                          ? styles.disabledButton
                                          : {}),
                                      }}
                                      onClick={() => handleClearRecord(member)}
                                      disabled={clearingUserId !== null}
                                    >
                                      {isClearing
                                        ? 'Removing...'
                                        : 'Clear record'}
                                    </button>
                                  ) : (
                                    <span style={styles.muted}>Not saved</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!readOnly && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        type="button"
                        style={{
                          ...styles.button,
                          ...(savingRecords ? styles.disabledButton : {}),
                        }}
                        onClick={saveAttendance}
                        disabled={savingRecords}
                      >
                        {savingRecords ? 'Saving...' : 'Save attendance'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}