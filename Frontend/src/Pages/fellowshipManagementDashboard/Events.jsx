import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const MY_GROUPS_ENDPOINT = '/api/groups/mine';
const ALL_GROUPS_ENDPOINT = '/api/groups';
const CURRENT_USER_ENDPOINT = '/api/auth/me';
const EVENTS_ENDPOINT = '/api/events';

const initialForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  event_location: '',
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
  editButton: {
    border: '1px solid #b2ccff',
    borderRadius: '7px',
    padding: '7px 10px',
    background: '#eff4ff',
    color: '#1849a9',
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteButton: {
    border: '1px solid #fda29b',
    borderRadius: '7px',
    padding: '7px 10px',
    background: '#fff',
    color: '#b42318',
    cursor: 'pointer',
    fontWeight: 600,
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
    if (Array.isArray(data?.[key])) return data[key];
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

function getEventStatus(event) {
  const now = Date.now();
  const start = new Date(event.start_date).getTime();
  const end = new Date(event.end_date).getTime();

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

function toDateTimeInput(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = (number) => String(number).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function getStatusLabel(status) {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'past') return 'Past';

  return 'Unknown';
}

function StatusBadge({ status }) {
  let badgeStyle = styles.pastBadge;

  if (status === 'upcoming') badgeStyle = styles.upcomingBadge;
  if (status === 'ongoing') badgeStyle = styles.ongoingBadge;

  return (
    <span style={{ ...styles.badge, ...badgeStyle }}>
      {getStatusLabel(status)}
    </span>
  );
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

// Automatically obtains the logged-in user's fellowship.
// It does not read group IDs from localStorage or require manual entry.
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

  // If /api/groups/mine is unavailable or has no fellowship,
  // fall back to the logged-in user's group hierarchy.
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
          meResponse.data?.error ||
          'Unable to identify your fellowship. Please sign in again.'
      );
    }
  }

  if (!fellowships.length) {
    throw new Error(
      'No fellowship was found for your account. Please contact an administrator.'
    );
  }

  // Prefer a fellowship whose leader is the logged-in user.
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

  // If the account has only one fellowship, use it automatically.
  if (fellowships.length === 1) return fellowships[0];

  // The endpoint returned multiple fellowships but no direct leader
  // match. Avoid silently creating an event in the wrong group.
  throw new Error(
    'More than one fellowship was found, but your primary fellowship could not be identified. Please ask the administrator to check your group assignment.'
  );
}

export default function FellowshipEvents() {
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');

  const [events, setEvents] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadFellowship = useCallback(async () => {
    setLoadingGroups(true);
    setError('');

    try {
      const fellowship = await fetchMyFellowship();

      if (!fellowship?.id) {
        throw new Error('The fellowship ID could not be identified.');
      }

      setGroupId(String(fellowship.id));
      setGroupName(fellowship.name || 'My Fellowship');
    } catch (err) {
      console.error('Load fellowship error:', err);
      setGroupId('');
      setGroupName('');
      setError(err.message || 'Failed to identify your fellowship.');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    setError('');

    try {
      const response = await fetchJson(
        `${EVENTS_ENDPOINT}?group_id=${encodeURIComponent(groupId)}`
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to load events.'
        );
      }

      setEvents(
        getArrayFromResponse(response.data, ['events', 'data'])
      );
    } catch (err) {
      console.error('Load events error:', err);
      setEvents([]);
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoadingEvents(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadFellowship();
  }, [loadFellowship]);

  useEffect(() => {
    if (!loadingGroups && groupId) {
      loadEvents();
    } else if (!groupId) {
      setEvents([]);
    }
  }, [groupId, loadingGroups, loadEvents]);

  const eventStats = useMemo(() => {
    return events.reduce(
      (stats, event) => {
        const status = getEventStatus(event);

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
  }, [events]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        const status = getEventStatus(event);

        const matchesStatus =
          statusFilter === 'all' || status === statusFilter;

        const searchable = [
          event.title,
          event.description,
          event.event_location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch = !search || searchable.includes(search);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() -
          new Date(b.start_date).getTime()
      );
  }, [events, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData(initialForm);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);

    setFormData({
      title: event.title || '',
      description: event.description || '',
      start_date: toDateTimeInput(event.start_date),
      end_date: toDateTimeInput(event.end_date),
      event_location: event.event_location || '',
    });

    setError('');
    setMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEvent(null);
    setFormData(initialForm);
    setError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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
    const startDate = formData.start_date;
    const endDate = formData.end_date;
    const location = formData.event_location.trim();

    if (!title) {
      setError('Please enter an event title.');
      return;
    }

    if (!description) {
      setError('Please enter an event description.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please enter both the start date and end date.');
      return;
    }

    if (
      Number.isNaN(new Date(startDate).getTime()) ||
      Number.isNaN(new Date(endDate).getTime())
    ) {
      setError('Please enter valid event dates.');
      return;
    }

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      setError('The event end date cannot be before its start date.');
      return;
    }

    // group_id is added automatically from the fellowship we fetched.
    // These are the columns supported by the current events table.
    const payload = {
      group_id: Number(groupId),
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      event_location: location || null,
    };

    const isEditing = Boolean(editingEvent?.id);

    try {
      setSaving(true);

      const response = await fetchJson(
        isEditing
          ? `${EVENTS_ENDPOINT}/${encodeURIComponent(editingEvent.id)}`
          : EVENTS_ENDPOINT,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            `Failed to ${isEditing ? 'update' : 'create'} event.`
        );
      }

      setMessage(
        isEditing
          ? 'Event updated successfully.'
          : 'Event created successfully.'
      );

      setShowModal(false);
      setEditingEvent(null);
      setFormData(initialForm);

      await loadEvents();
    } catch (err) {
      console.error('Save event error:', err);
      setError(err.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!event?.id) {
      setError('Unable to identify the event to delete.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setDeletingId(String(event.id));

    try {
      const response = await fetchJson(
        `${EVENTS_ENDPOINT}/${encodeURIComponent(event.id)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to delete event.'
        );
      }

      setMessage('Event deleted successfully.');

      setEvents((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(event.id)
        )
      );
    } catch (err) {
      console.error('Delete event error:', err);
      setError(err.message || 'Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Fellowship Events</h1>

          <p style={styles.subtitle}>
            Create and manage events for your fellowship.
          </p>

          {!loadingGroups && groupName && (
            <p style={styles.muted}>
              Fellowship: <strong>{groupName}</strong>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              loadFellowship();
            }}
            disabled={loadingGroups}
          >
            {loadingGroups ? 'Loading fellowship...' : 'Refresh fellowship'}
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
            + Create event
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
          <p style={styles.muted}>Identifying your fellowship...</p>
        </section>
      ) : !groupId ? (
        <section style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>
            Fellowship unavailable
          </h2>

          <p style={styles.muted}>
            Your account does not currently have an identifiable fellowship.
            The page will not guess a group ID or save events to the wrong
            group. Ask an administrator to check your fellowship assignment.
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
              <div style={styles.statLabel}>Total events</div>
              <p style={styles.statValue}>{eventStats.total}</p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Upcoming</div>
              <p style={styles.statValue}>{eventStats.upcoming}</p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Ongoing</div>
              <p style={styles.statValue}>{eventStats.ongoing}</p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Past events</div>
              <p style={styles.statValue}>{eventStats.past}</p>
            </div>
          </div>

          <section style={styles.panel}>
            <div style={styles.toolbar}>
              <input
                type="search"
                style={styles.searchInput}
                placeholder="Search events by title, description or location..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                aria-label="Filter events by status"
                style={styles.select}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={loadEvents}
                disabled={loadingEvents}
              >
                {loadingEvents ? 'Refreshing...' : 'Refresh events'}
              </button>
            </div>

            {loadingEvents ? (
              <p style={styles.muted}>Loading events...</p>
            ) : filteredEvents.length === 0 ? (
              <div style={{ padding: '28px 10px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>No events found</h3>

                <p style={styles.muted}>
                  {events.length === 0
                    ? 'Your fellowship has no events yet. Create an event to get started.'
                    : 'No events match your current search or status filter.'}
                </p>

                {events.length === 0 && (
                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={openCreateModal}
                  >
                    Create your first event
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Event</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Starts</th>
                      <th style={styles.th}>Ends</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEvents.map((event) => {
                      const status = getEventStatus(event);

                      return (
                        <tr key={event.id}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: 600 }}>
                              {event.title || 'Untitled event'}
                            </div>

                            <div
                              style={{
                                ...styles.muted,
                                marginTop: '5px',
                                maxWidth: '260px',
                                overflowWrap: 'anywhere',
                              }}
                            >
                              {event.description || 'No description'}
                            </div>
                          </td>

                          <td style={styles.td}>
                            {event.event_location || 'Not specified'}
                          </td>

                          <td style={styles.td}>
                            {formatDate(event.start_date)}
                          </td>

                          <td style={styles.td}>
                            {formatDate(event.end_date)}
                          </td>

                          <td style={styles.td}>
                            <StatusBadge status={status} />
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
                                style={styles.editButton}
                                onClick={() => openEditModal(event)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                style={{
                                  ...styles.deleteButton,
                                  opacity:
                                    deletingId === String(event.id) ? 0.6 : 1,
                                }}
                                onClick={() => handleDelete(event)}
                                disabled={deletingId !== null}
                              >
                                {deletingId === String(event.id)
                                  ? 'Deleting...'
                                  : 'Delete'}
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
        </>
      )}

      {showModal && (
        <div
          style={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <h2
                  id="event-modal-title"
                  style={{ margin: 0, fontSize: '21px' }}
                >
                  {editingEvent ? 'Edit event' : 'Create event'}
                </h2>

                <p style={{ ...styles.muted, marginBottom: 0 }}>
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
                <label htmlFor="event-title" style={styles.label}>
                  Event title *
                </label>

                <input
                  id="event-title"
                  name="title"
                  type="text"
                  style={styles.input}
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter the event title"
                  maxLength={200}
                  required
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="event-description" style={styles.label}>
                  Description *
                </label>

                <textarea
                  id="event-description"
                  name="description"
                  style={styles.textarea}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the event"
                  rows={4}
                  required
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="event-location" style={styles.label}>
                  Event location
                </label>

                <input
                  id="event-location"
                  name="event_location"
                  type="text"
                  style={styles.input}
                  value={formData.event_location}
                  onChange={handleInputChange}
                  placeholder="Enter the event venue"
                  maxLength={250}
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="event-start-date" style={styles.label}>
                  Start date and time *
                </label>

                <input
                  id="event-start-date"
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
                <label htmlFor="event-end-date" style={styles.label}>
                  End date and time *
                </label>

                <input
                  id="event-end-date"
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
                This event will be associated with your fellowship
                automatically. You do not need to enter a group ID.
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
                    ? 'Saving...'
                    : editingEvent
                      ? 'Save changes'
                      : 'Create event'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}