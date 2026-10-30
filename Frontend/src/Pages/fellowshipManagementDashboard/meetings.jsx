import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const MY_GROUPS_ENDPOINT = '/api/groups/mine';
const ALL_GROUPS_ENDPOINT = '/api/groups';
const CURRENT_USER_ENDPOINT = '/api/auth/me';
const MEETINGS_ENDPOINT = '/api/meetings';
const REQUESTS_ENDPOINT = '/api/requests';
const MY_REQUESTS_ENDPOINT = '/api/requests/mine';

const initialForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  location: '',
};

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    color: '#172033',
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
    fontWeight: 700,
  },
  subtitle: {
    color: '#667085',
    marginTop: '8px',
    lineHeight: 1.5,
  },
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px',
  },
  statLabel: {
    color: '#667085',
    fontSize: '13px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '27px',
    fontWeight: 700,
    margin: 0,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  searchInput: {
    flex: '1 1 260px',
    minWidth: '180px',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  select: {
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#344054',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  primaryButton: {
    border: 0,
    borderRadius: '8px',
    padding: '11px 16px',
    background: '#253b80',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    padding: '10px 14px',
    background: '#fff',
    color: '#344054',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dangerButton: {
    border: '1px solid #fecdca',
    borderRadius: '8px',
    padding: '8px 14px',
    background: '#fef3f2',
    color: '#b42318',
    fontWeight: 600,
    fontSize: '13px',
  },
  tableWrap: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '760px',
  },
  th: {
    textAlign: 'left',
    padding: '13px 12px',
    background: '#f9fafb',
    color: '#475467',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    textAlign: 'left',
    padding: '14px 12px',
    borderBottom: '1px solid #eaecf0',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  upcomingBadge: {
    background: '#eff8ff',
    color: '#175cd3',
  },
  ongoingBadge: {
    background: '#ecfdf3',
    color: '#027a48',
  },
  pastBadge: {
    background: '#f2f4f7',
    color: '#475467',
  },
  badgePending: { background: '#fffaeb', color: '#b54708' },
  badgeApproved: { background: '#ecfdf3', color: '#027a48' },
  badgeRejected: { background: '#fef3f2', color: '#b42318' },
  error: {
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: '#fef3f2',
    color: '#b42318',
    fontSize: '14px',
  },
  success: {
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: '#ecfdf3',
    color: '#027a48',
    fontSize: '14px',
  },
  muted: {
    color: '#667085',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(16,24,40,.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    overflowY: 'auto',
  },
  modal: {
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
};

function getArrayFromResponse(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getCurrentUser(data) {
  return data?.user ?? data?.data ?? data ?? {};
}

function getCurrentUserId(data) {
  const user = getCurrentUser(data);

  return user?.id ?? user?.user_id ?? user?._id ?? null;
}

function getGroupLeaderId(group) {
  return (
    group?.leader_id ??
    group?.leader_user_id ??
    group?.created_by ??
    group?.owner_id ??
    null
  );
}

function getGroupParentId(group) {
  return group?.parent_group_id ?? group?.parent_id ?? null;
}

function getGroupsUnderUser(groups, userId) {
  const included = new Set(
    groups
      .filter((group) => {
        const leaderId = getGroupLeaderId(group);

        return (
          leaderId !== null &&
          leaderId !== undefined &&
          String(leaderId) === String(userId)
        );
      })
      .map((group) => String(group.id))
  );

  let changed = true;

  while (changed) {
    changed = false;

    groups.forEach((group) => {
      const parentId = getGroupParentId(group);

      if (
        parentId !== null &&
        parentId !== undefined &&
        included.has(String(parentId)) &&
        !included.has(String(group.id))
      ) {
        included.add(String(group.id));
        changed = true;
      }
    });
  }

  return groups.filter((group) => included.has(String(group.id)));
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

// Identifies the logged-in user's fellowship automatically.
async function fetchMyFellowship() {
  let groups = [];
  let groupsFromMine = false;

  try {
    const mineResponse = await fetchJson(MY_GROUPS_ENDPOINT);

    if (mineResponse.ok) {
      groups = getArrayFromResponse(mineResponse.data, [
        'groups',
        'data',
      ]);

      groupsFromMine = true;
    }
  } catch (error) {
    console.error('Could not load my groups endpoint:', error);
  }

  let fellowships = groups.filter(
    (group) =>
      String(group.type || '').toLowerCase() === 'fellowship'
  );

  if (!groupsFromMine || fellowships.length === 0) {
    const [allResponse, meResponse] = await Promise.all([
      fetchJson(ALL_GROUPS_ENDPOINT),
      fetchJson(CURRENT_USER_ENDPOINT),
    ]);

    if (allResponse.ok && meResponse.ok) {
      const allGroups = getArrayFromResponse(allResponse.data, [
        'groups',
        'data',
      ]);

      const userId = getCurrentUserId(meResponse.data);

      if (userId !== null && userId !== undefined) {
        groups = getGroupsUnderUser(allGroups, userId);
      }

      fellowships = groups.filter(
        (group) =>
          String(group.type || '').toLowerCase() === 'fellowship'
      );
    } else if (!groupsFromMine) {
      throw new Error(
        allResponse.data?.error ||
          allResponse.data?.message ||
          meResponse.data?.error ||
          meResponse.data?.message ||
          'Unable to identify your fellowship. Please sign in again.'
      );
    }
  }

  if (!fellowships.length) {
    throw new Error(
      'No fellowship was found for your account. Please contact an administrator.'
    );
  }

  try {
    const meResponse = await fetchJson(CURRENT_USER_ENDPOINT);

    if (meResponse.ok) {
      const userId = getCurrentUserId(meResponse.data);

      const directlyLed = fellowships.find((group) => {
        const leaderId = getGroupLeaderId(group);

        return (
          userId !== null &&
          userId !== undefined &&
          leaderId !== null &&
          leaderId !== undefined &&
          String(leaderId) === String(userId)
        );
      });

      if (directlyLed) return directlyLed;
    }
  } catch (error) {
    console.error('Could not identify direct fellowship leader:', error);
  }

  if (fellowships.length === 1) {
    return fellowships[0];
  }

  throw new Error(
    'More than one fellowship was found, but your primary fellowship could not be identified. Please ask the administrator to check your group assignment.'
  );
}

function getMeetingStatus(meeting) {
  const now = Date.now();

  const start = new Date(
    meeting.start_date ?? meeting.start_datetime
  ).getTime();

  const end = new Date(
    meeting.end_date ?? meeting.end_datetime
  ).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'unknown';
  }

  if (now < start) return 'upcoming';
  if (now <= end) return 'ongoing';

  return 'past';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status) {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'past') return 'Past';

  return 'Unknown';
}

function StatusBadge({ status }) {
  let badgeStyle = styles.pastBadge;

  if (status === 'upcoming') {
    badgeStyle = styles.upcomingBadge;
  }

  if (status === 'ongoing') {
    badgeStyle = styles.ongoingBadge;
  }

  return (
    <span style={{ ...styles.badge, ...badgeStyle }}>
      {getStatusLabel(status)}
    </span>
  );
}

// Reads request_data whether the API returns an object or a JSON string.
function getRequestData(request) {
  const data = request?.request_data;

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  return data || {};
}

function getRequestStatus(request) {
  const status = String(request?.status || 'pending').toLowerCase();

  if (status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'declined') return 'rejected';

  return 'pending';
}

function RequestStatusBadge({ status }) {
  const variants = {
    pending: { style: styles.badgePending, label: 'Pending approval' },
    approved: { style: styles.badgeApproved, label: 'Approved' },
    rejected: { style: styles.badgeRejected, label: 'Rejected' },
  };

  const variant = variants[status] || variants.pending;

  return (
    <span style={{ ...styles.badge, ...variant.style }}>
      {variant.label}
    </span>
  );
}

export default function FellowshipMeetingsPage() {
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');

  const [meetings, setMeetings] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  // Find the logged-in user's fellowship.
  const loadFellowship = useCallback(async () => {
    setLoadingGroups(true);
    setError('');

    try {
      const fellowship = await fetchMyFellowship();

      if (!fellowship?.id) {
        throw new Error(
          'The fellowship ID could not be identified.'
        );
      }

      setGroupId(String(fellowship.id));
      setGroupName(fellowship.name || 'My Fellowship');
    } catch (err) {
      console.error('Load fellowship error:', err);

      setGroupId('');
      setGroupName('');

      setError(
        err.message || 'Failed to identify your fellowship.'
      );
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Load approved meetings for the identified fellowship.
  const loadMeetings = useCallback(async () => {
    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setMeetings([]);
      setLoadingMeetings(false);
      return;
    }

    setLoadingMeetings(true);
    setError('');

    try {
      const response = await fetchJson(
        `${MEETINGS_ENDPOINT}?groupId=${encodeURIComponent(groupId)}`
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to load meetings.'
        );
      }

      setMeetings(
        getArrayFromResponse(response.data, [
          'meetings',
          'data',
        ])
      );
    } catch (err) {
      console.error('Load meetings error:', err);

      setMeetings([]);
      setError(err.message || 'Failed to load meetings.');
    } finally {
      setLoadingMeetings(false);
    }
  }, [groupId]);

  // Load the meeting requests submitted by the logged-in user.
  const loadMyRequests = useCallback(async () => {
    setLoadingRequests(true);

    try {
      const response = await fetchJson(MY_REQUESTS_ENDPOINT);

      if (!response.ok) {
        console.error(
          'Failed to load my requests:',
          response.data?.error || response.status
        );
        return;
      }

      setMyRequests(
        getArrayFromResponse(response.data, ['requests', 'data'])
      );
    } catch (err) {
      console.error('Load my requests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadFellowship();
  }, [loadFellowship]);

  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  useEffect(() => {
    if (!loadingGroups && groupId) {
      loadMeetings();
    } else if (!groupId) {
      setMeetings([]);
    }
  }, [groupId, loadingGroups, loadMeetings]);

  // Refresh meetings and request statuses when the tab regains focus.
  useEffect(() => {
    const refreshOnFocus = () => {
      if (groupId) loadMeetings();
      loadMyRequests();
    };

    window.addEventListener('focus', refreshOnFocus);

    return () => window.removeEventListener('focus', refreshOnFocus);
  }, [groupId, loadMeetings, loadMyRequests]);

  const meetingStats = useMemo(() => {
    return meetings.reduce(
      (stats, meeting) => {
        const status = getMeetingStatus(meeting);

        stats.total += 1;

        if (status === 'upcoming') stats.upcoming += 1;
        if (status === 'ongoing') stats.ongoing += 1;
        if (status === 'past') stats.past += 1;

        return stats;
      },
      {
        total: 0,
        upcoming: 0,
        ongoing: 0,
        past: 0,
      }
    );
  }, [meetings]);

  // One combined list: approved meetings + requests that are still
  // pending or were rejected. Approved requests are skipped because the
  // approved meeting already appears as its own row.
  const allRows = useMemo(() => {
    const meetingRows = meetings.map((meeting) => ({
      key: `meeting-${meeting.id}`,
      id: meeting.id,
      source: 'meeting',
      title: meeting.title,
      description: meeting.description,
      location: meeting.location,
      start: meeting.start_date ?? meeting.start_datetime,
      end: meeting.end_date ?? meeting.end_datetime,
      approval: 'approved',
      timing: getMeetingStatus(meeting),
      reviewNote: null,
    }));

    const requestRows = myRequests
      .filter(
        (request) =>
          request.request_type === 'meeting' &&
          String(request.group_id) === String(groupId) &&
          getRequestStatus(request) !== 'approved'
      )
      .map((request) => {
        const data = getRequestData(request);

        return {
          key: `request-${request.id}`,
          id: request.id,
          source: 'request',
          title: data.title,
          description: data.description,
          location: data.location,
          start: data.start_date,
          end: data.end_date,
          approval: getRequestStatus(request),
          timing: null,
          reviewNote: request.review_note || null,
        };
      });

    return [...meetingRows, ...requestRows];
  }, [meetings, myRequests, groupId]);

  const tableRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allRows
      .filter((row) => {
        const filterKey = row.timing ?? row.approval;

        const matchesStatus =
          statusFilter === 'all' || filterKey === statusFilter;

        const searchable = [row.title, row.description, row.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch = !search || searchable.includes(search);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          (new Date(a.start).getTime() || 0) -
          (new Date(b.start).getTime() || 0)
      );
  }, [allRows, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setFormData(initialForm);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormData(initialForm);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // New meetings are submitted as requests for administrator approval.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setError(
        'Your fellowship could not be identified. Refresh the page and try again.'
      );
      return;
    }

    const title = formData.title.trim();
    const description = formData.description.trim();
    const location = formData.location.trim();

    if (!title) {
      setError('Please enter a meeting title.');
      return;
    }

    if (!description) {
      setError('Please enter a meeting description.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError(
        'Please enter both the meeting start date and end date.'
      );
      return;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError('Please enter valid meeting dates.');
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setError(
        'The meeting end date must be after its start date.'
      );
      return;
    }

    const payload = {
      request_type: 'meeting',
      group_id: Number(groupId),
      request_data: {
        title,
        description,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        location: location || null,
      },
    };

    try {
      setSaving(true);

      const response = await fetchJson(REQUESTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to submit the meeting request.'
        );
      }

      setMessage(
        'Meeting request submitted successfully. It is awaiting administrator approval.'
      );

      setShowModal(false);
      setFormData(initialForm);

      // The pending request now appears in the table below.
      await loadMyRequests();
    } catch (err) {
      console.error('Submit meeting request error:', err);

      setError(
        err.message || 'Failed to submit the meeting request.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete an approved meeting.
  const handleDeleteMeeting = async (meetingId, meetingTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the meeting "${
        meetingTitle || 'Untitled meeting'
      }"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      setDeletingId(meetingId);

      const response = await fetchJson(
        `${MEETINGS_ENDPOINT}/${encodeURIComponent(meetingId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to delete the meeting.'
        );
      }

      setMessage('Meeting deleted successfully.');

      await loadMeetings();
    } catch (err) {
      console.error('Delete meeting error:', err);
      setError(err.message || 'Failed to delete the meeting.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Fellowship Meetings</h1>

          <p style={styles.subtitle}>
            View approved meetings and submit new meeting requests
            for your fellowship.
          </p>

          {!loadingGroups && groupName && (
            <p style={styles.muted}>
              Fellowship: <strong>{groupName}</strong>
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadFellowship}
            disabled={loadingGroups}
          >
            {loadingGroups
              ? 'Loading fellowship...'
              : 'Refresh fellowship'}
          </button>

          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: !groupId || loadingGroups ? 0.6 : 1,
            }}
            onClick={openCreateModal}
            disabled={!groupId || loadingGroups}
          >
            + Create meeting
          </button>
        </div>
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

      {loadingGroups ? (
        <section style={styles.panel}>
          <p style={styles.muted}>
            Identifying your fellowship...
          </p>
        </section>
      ) : !groupId ? (
        <section style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>
            Fellowship unavailable
          </h2>

          <p style={styles.muted}>
            Your account does not currently have an identifiable
            fellowship. The page will not guess a group ID or submit
            a request for the wrong group. Ask an administrator to
            check your fellowship assignment.
          </p>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadFellowship}
          >
            Try again
          </button>
        </section>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>
                Total meetings
              </div>
              <p style={styles.statValue}>
                {meetingStats.total}
              </p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Upcoming</div>
              <p style={styles.statValue}>
                {meetingStats.upcoming}
              </p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Ongoing</div>
              <p style={styles.statValue}>
                {meetingStats.ongoing}
              </p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Past meetings</div>
              <p style={styles.statValue}>
                {meetingStats.past}
              </p>
            </div>
          </div>

          <section style={styles.panel}>
            <div style={styles.toolbar}>
              <input
                type="search"
                style={styles.searchInput}
                placeholder="Search meetings by title, description or location..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

              <select
                aria-label="Filter meetings by status"
                style={styles.select}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="all">All statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
                <option value="pending">Pending approval</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => {
                  loadMeetings();
                  loadMyRequests();
                }}
                disabled={loadingMeetings || loadingRequests}
              >
                {loadingMeetings || loadingRequests
                  ? 'Refreshing...'
                  : 'Refresh meetings'}
              </button>
            </div>

            {loadingMeetings ? (
              <p style={styles.muted}>
                Loading meetings...
              </p>
            ) : tableRows.length === 0 ? (
              <div
                style={{
                  padding: '28px 10px',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  No meetings found
                </h3>

                <p style={styles.muted}>
                  {allRows.length === 0
                    ? 'Your fellowship has no meetings or meeting requests yet. Submit a meeting request for administrator approval.'
                    : 'No meetings match your current search or status filter.'}
                </p>

                {allRows.length === 0 && (
                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={openCreateModal}
                  >
                    Submit a meeting request
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Meeting</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Starts</th>
                      <th style={styles.th}>Ends</th>
                      <th style={styles.th}>Approval</th>
                      <th style={styles.th}>Timing</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.key}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600 }}>
                            {row.title || 'Untitled meeting'}
                          </div>

                          <div
                            style={{
                              ...styles.muted,
                              marginTop: '5px',
                              maxWidth: '300px',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {row.description || 'No description'}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {row.location || 'Not specified'}
                        </td>

                        <td style={styles.td}>
                          {formatDate(row.start)}
                        </td>

                        <td style={styles.td}>
                          {formatDate(row.end)}
                        </td>

                        <td style={styles.td}>
                          <RequestStatusBadge status={row.approval} />

                          {row.approval === 'rejected' &&
                            row.reviewNote && (
                              <div
                                style={{
                                  ...styles.muted,
                                  marginTop: '6px',
                                  maxWidth: '220px',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {row.reviewNote}
                              </div>
                            )}
                        </td>

                        <td style={styles.td}>
                          {row.timing ? (
                            <StatusBadge status={row.timing} />
                          ) : (
                            <span style={styles.muted}>—</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          {row.source === 'meeting' ? (
                            <button
                              type="button"
                              style={{
                                ...styles.dangerButton,
                                opacity:
                                  deletingId === row.id ? 0.6 : 1,
                                cursor:
                                  deletingId === row.id
                                    ? 'not-allowed'
                                    : 'pointer',
                              }}
                              onClick={() =>
                                handleDeleteMeeting(row.id, row.title)
                              }
                              disabled={deletingId === row.id}
                              aria-label={`Delete meeting ${
                                row.title || ''
                              }`}
                            >
                              {deletingId === row.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          ) : (
                            <span style={styles.muted}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showModal && (
        <div
          style={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-modal-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <h2
                  id="meeting-modal-title"
                  style={{ margin: 0, fontSize: '21px' }}
                >
                  Create meeting request
                </h2>

                <p
                  style={{
                    ...styles.muted,
                    marginBottom: 0,
                  }}
                >
                  Fellowship: {groupName}
                </p>
              </div>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={closeModal}
                disabled={saving}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label
                  htmlFor="meeting-title"
                  style={styles.label}
                >
                  Meeting title *
                </label>

                <input
                  id="meeting-title"
                  name="title"
                  type="text"
                  style={styles.input}
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter the meeting title"
                  maxLength={200}
                  required
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="meeting-description"
                  style={styles.label}
                >
                  Description *
                </label>

                <textarea
                  id="meeting-description"
                  name="description"
                  style={styles.textarea}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the meeting"
                  rows={4}
                  required
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="meeting-location"
                  style={styles.label}
                >
                  Meeting location
                </label>

                <input
                  id="meeting-location"
                  name="location"
                  type="text"
                  style={styles.input}
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter the meeting venue"
                  maxLength={250}
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="meeting-start-date"
                  style={styles.label}
                >
                  Start date and time *
                </label>

                <input
                  id="meeting-start-date"
                  name="start_date"
                  type="datetime-local"
                  style={styles.input}
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="meeting-end-date"
                  style={styles.label}
                >
                  End date and time *
                </label>

                <input
                  id="meeting-end-date"
                  name="end_date"
                  type="datetime-local"
                  style={styles.input}
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <p style={styles.muted}>
                This request will be sent to the administrator.
                The meeting will appear in the approved meetings
                list only after approval.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '22px',
                }}
              >
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.primaryButton,
                    opacity: saving ? 0.6 : 1,
                  }}
                  disabled={saving}
                >
                  {saving
                    ? 'Submitting...'
                    : 'Submit for approval'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}