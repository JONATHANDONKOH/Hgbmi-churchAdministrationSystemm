import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: options.body
      ? {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        }
      : options.headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || 'Something went wrong'
    );
  }

  return data;
}

const hasPermission = (permissions, permissionName) =>
  permissions.some((permission) =>
    typeof permission === 'string'
      ? permission === permissionName
      : permission?.name === permissionName
  );

const TYPE_LABELS = {
  event: 'Event',
  meeting: 'Meeting',
  user: 'New member',
  leader_assignment: 'Leader assignment',
  group_creation: 'Group creation',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES = {
  pending: {
    background: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
  },
  approved: {
    background: '#dcfce7',
    color: '#166534',
    border: '#86efac',
  },
  rejected: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '#fca5a5',
  },
};

/* ---------- Formatting ---------- */

const formatDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatEventTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const capitalize = (text) => {
  if (!text) return '';

  const value = String(text);

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getRequestData = (item) => {
  const value = item?.request_data ?? item?.requestData ?? {};

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return value && typeof value === 'object' ? value : {};
};

const getSelectedMember = (data) => {
  const member = data.selected_member || data.selectedMember || {};

  return {
    ...member,
    full_name:
      member.full_name ||
      member.fullName ||
      data.full_name ||
      data.leader_full_name ||
      '',
    email:
      member.email ||
      data.email ||
      data.leader_email ||
      '',
    phone_number:
      member.phone_number ||
      member.phoneNumber ||
      data.phone_number ||
      data.leader_phone_number ||
      data.phone ||
      '',
    current_role:
      member.current_role ||
      member.currentRole ||
      data.current_role ||
      data.leader_current_role ||
      '',
    id:
      member.id ||
      data.target_user_id ||
      data.selected_member_id ||
      null,
  };
};

/* ---------- Request summaries ---------- */

const describe = (item) => {
  const data = getRequestData(item);

  if (item.request_type === 'event') {
    return {
      title: data.title || 'Untitled event',
      detail: formatEventTime(
        data.start_datetime || data.start_date
      ),
    };
  }

  // Meeting request summary
  if (item.request_type === 'meeting') {
    return {
      title: data.title || 'Untitled meeting',
      detail: formatEventTime(
        data.start_date ||
        data.start_datetime ||
        data.startDate
      ),
    };
  }

  if (item.request_type === 'user') {
    return {
      title: data.full_name || 'New member',
      detail: data.email || '',
    };
  }

  if (item.request_type === 'leader_assignment') {
    const member = getSelectedMember(data);

    return {
      title:
        member.full_name ||
        `Member #${data.target_user_id || 'unknown'}`,
      detail: data.requested_role
        ? `Promote to ${data.requested_role}`
        : '',
    };
  }

  if (item.request_type === 'group_creation') {
    return {
      title: data.name || 'New group',
      detail: [data.type, data.location]
        .filter(Boolean)
        .join(' · '),
    };
  }

  return {
    title: TYPE_LABELS[item.request_type] || item.request_type,
    detail: '',
  };
};

/* ---------- Request details ---------- */

const detailRows = (item) => {
  const data = getRequestData(item);

  if (item.request_type === 'event') {
    return [
      ['Title', data.title],
      ['Description', data.description],
      ['Location', data.location],
      [
        'Starts',
        formatEventTime(
          data.start_datetime || data.start_date
        ),
      ],
      [
        'Ends',
        formatEventTime(
          data.end_datetime || data.end_date
        ),
      ],
    ];
  }

  // Complete meeting information
  if (item.request_type === 'meeting') {
    return [
      ['Title', data.title],
      ['Description', data.description],
      ['Location', data.location],
      [
        'Starts',
        formatEventTime(
          data.start_date ||
          data.start_datetime ||
          data.startDate
        ),
      ],
      [
        'Ends',
        formatEventTime(
          data.end_date ||
          data.end_datetime ||
          data.endDate
        ),
      ],
    ];
  }

  if (item.request_type === 'user') {
    return [
      ['Full name', data.full_name],
      ['Email', data.email],
      ['Phone', data.phone || data.phone_number],
      ['Requested role', data.requested_role],
    ];
  }

  if (item.request_type === 'leader_assignment') {
    const member = getSelectedMember(data);

    return [
      ['Member name', member.full_name || 'Not available'],
      ['Member ID', member.id || 'Not available'],
      ['Phone number', member.phone_number || 'Not available'],
      ['Email', member.email || 'Not available'],
      ['Current role', member.current_role || 'Not available'],
      ['Requested role', data.requested_role || 'Not available'],
    ];
  }

  if (item.request_type === 'group_creation') {
    const parentGroup = data.parent_group_details || {};
    const parentLeader = data.parent_leader_details || {};
    const newLeader = getSelectedMember(data);

    return [
      ['Proposed group name', data.name],
      ['Group type', data.type],
      ['Location', data.location],
      ['Description', data.description],
      [
        'Parent group',
        parentGroup.name ||
          data.parent_group_name ||
          data.parent_group_id,
      ],
      ['Parent group type', parentGroup.type],
      ['Parent leader name', parentLeader.full_name],
      ['Parent leader phone', parentLeader.phone_number],
      ['Parent leader email', parentLeader.email],
      ['Proposed leader name', newLeader.full_name || 'Not available'],
      ['Proposed leader ID', newLeader.id || 'Not available'],
      [
        'Proposed leader phone',
        newLeader.phone_number || 'Not available',
      ],
      [
        'Proposed leader email',
        newLeader.email || 'Not available',
      ],
      [
        'Current role',
        newLeader.current_role || 'Not available',
      ],
      [
        'Requested role',
        data.requested_role || 'Not available',
      ],
    ];
  }

  return [];
};

/* ---------- Inline styles ---------- */

const ui = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    padding: '24px 0',
    color: '#0f172a',
  },

  title: {
    margin: 0,
    fontSize: '2rem',
    lineHeight: 1.2,
    color: '#0f172a',
  },

  subtitle: {
    margin: '8px 0 0',
    color: '#475569',
    fontSize: '0.96rem',
    lineHeight: 1.6,
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 18,
  },

  cardTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },

  input: {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: '0.95rem',
    background: '#fff',
    color: '#0f172a',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  empty: {
    margin: 0,
    padding: 12,
    color: '#64748b',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: 12,
  },

  typeChip: {
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },

  modal: {
    width: 'min(720px, 100%)',
    maxHeight: '85vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: 18,
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
    padding: 24,
    color: '#0f172a',
    boxSizing: 'border-box',
  },

  sectionLabel: {
    margin: '22px 0 10px',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  dt: {
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: 700,
    paddingTop: 2,
  },

  dd: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.6,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-line',
  },
};

const button = (variant, disabled = false) => ({
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,

  ...(variant === 'approve' && {
    background: '#16a34a',
    color: '#fff',
  }),

  ...(variant === 'reject' && {
    background: '#dc2626',
    color: '#fff',
  }),

  ...(variant === 'secondary' && {
    background: '#e2e8f0',
    color: '#0f172a',
  }),

  ...(variant === 'dark' && {
    background: '#0f172a',
    color: '#fff',
  }),
});

const tab = (active) => ({
  padding: '9px 14px',
  borderRadius: 999,
  border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
  background: active ? '#dbeafe' : '#fff',
  color: active ? '#1d4ed8' : '#334155',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
});

const alertBox = (type) => ({
  margin: 0,
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: '0.9rem',
  background: type === 'success' ? '#dcfce7' : '#fee2e2',
  color: type === 'success' ? '#166534' : '#991b1b',
  border: `1px solid ${
    type === 'success' ? '#86efac' : '#fca5a5'
  }`,
});

/* ---------- Small components ---------- */

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    background: '#e2e8f0',
    color: '#334155',
    border: '#cbd5e1',
  };

  return (
    <span
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {capitalize(status)}
    </span>
  );
}

function DetailList({ rows }) {
  const visible = rows.filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ''
  );

  if (visible.length === 0) {
    return (
      <p style={{ margin: 0, color: '#64748b' }}>
        No details available.
      </p>
    );
  }

  return (
    <dl
      style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: '10px 20px',
        fontSize: '0.92rem',
      }}
    >
      {visible.map(([label, value]) => (
        <Fragment key={label}>
          <dt style={ui.dt}>{label}</dt>
          <dd style={ui.dd}>{String(value)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/* ---------- Request card ---------- */

function RequestTile({ item, onOpen, onDelete, deleting }) {
  const [active, setActive] = useState(false);
  const { title, detail } = describe(item);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        padding: 16,
        background: active ? '#ffffff' : '#f8fafc',
        border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: 12,
        boxShadow: active
          ? '0 8px 20px rgba(37, 99, 235, 0.12)'
          : 'none',
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 10,
          width: '100%',
          padding: 0,
          textAlign: 'left',
          font: 'inherit',
          color: '#0f172a',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
        }}
      >
        <div style={{ ...ui.row, justifyContent: 'space-between' }}>
          <span style={ui.typeChip}>
            {TYPE_LABELS[item.request_type] || item.request_type}
          </span>

          <StatusBadge status={item.status} />
        </div>

        <strong style={{ fontSize: '1rem', overflowWrap: 'anywhere' }}>
          {title}
        </strong>

        {detail && (
          <span
            style={{
              color: '#475569',
              fontSize: '0.88rem',
              overflowWrap: 'anywhere',
            }}
          >
            {detail}
          </span>
        )}

        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {item.requested_by_name
            ? `by ${item.requested_by_name} · `
            : ''}
          {formatDateTime(item.created_at)}
        </span>
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e2e8f0',
          paddingTop: 10,
        }}
      >
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(item)}
          style={{
            ...button('reject', deleting),
            padding: '7px 12px',
            fontSize: '0.85rem',
          }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Request details modal ---------- */

function RequestModal({
  item,
  onClose,
  onReviewed,
  canApprove,
  canReject,
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const review = async (action) => {
    setBusy(action);
    setError('');
    setMessage('');

    try {
      const updated = await apiRequest(
        `/requests/${item.id}/${action}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            review_note: note.trim() || undefined,
          }),
        }
      );

      onReviewed(updated);

      setMessage(
        `Request ${updated.status || action} successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const isPending = item.status === 'pending';

  return (
    <div style={ui.overlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request details"
        style={ui.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={ui.row}>
              <span style={ui.typeChip}>
                {TYPE_LABELS[item.request_type] || item.request_type}
              </span>

              <StatusBadge status={item.status} />
            </div>

            <h2
              style={{
                margin: '12px 0 0',
                fontSize: '1.3rem',
                overflowWrap: 'anywhere',
              }}
            >
              {describe(item).title}
            </h2>
          </div>

          <button
            type="button"
            style={button('dark')}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p style={ui.sectionLabel}>Request</p>

        <DetailList
          rows={[
            ['Group', item.group_name],
            ['Requested by', item.requested_by_name],
            ['Submitted', formatDateTime(item.created_at)],
          ]}
        />

        <p style={ui.sectionLabel}>Details</p>

        <DetailList rows={detailRows(item)} />

        {message && (
          <p
            style={{ ...alertBox('success'), marginTop: 20 }}
            role="status"
          >
            {message}
          </p>
        )}

        {!isPending && (
          <>
            <p style={ui.sectionLabel}>Decision</p>

            <DetailList
              rows={[
                ['Decision', capitalize(item.status)],
                [
                  'Reviewed',
                  formatDateTime(item.reviewed_at),
                ],
                ['Review note', item.review_note],
              ]}
            />
          </>
        )}

        {isPending && (
          <>
            <p style={ui.sectionLabel}>Review</p>

            {error && (
              <p
                style={{ ...alertBox('error'), marginBottom: 12 }}
                role="alert"
              >
                {error}
              </p>
            )}

            <input
              style={ui.input}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Review note (optional)"
              maxLength={1000}
              disabled={Boolean(busy)}
            />

            <div
              style={{
                ...ui.row,
                justifyContent: 'flex-end',
                marginTop: 14,
              }}
            >
              {canReject && (
                <button
                  type="button"
                  style={button('reject', Boolean(busy))}
                  disabled={Boolean(busy)}
                  onClick={() => review('reject')}
                >
                  {busy === 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
              )}

              {canApprove && (
                <button
                  type="button"
                  style={button('approve', Boolean(busy))}
                  disabled={Boolean(busy)}
                  onClick={() => review('approve')}
                >
                  {busy === 'approve' ? 'Approving...' : 'Approve'}
                </button>
              )}

              {!canApprove && !canReject && (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  You do not have permission to approve or reject requests.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

export default function AdministrationRequestsPage() {
  const [items, setItems] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissionsError, setPermissionsError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPermissions = useCallback(async (signal) => {
    setPermissionsLoading(true);
    setPermissionsError('');

    try {
      const data = await apiRequest('/user-permissions/me', {
        signal,
      });

      if (!Array.isArray(data.permissions)) {
        throw new Error('The permissions response is invalid.');
      }

      setPermissions(data.permissions);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(
          'Failed to fetch administrator permissions:',
          err
        );

        setPermissions([]);
        setPermissionsError(
          'Could not load your permissions. Refresh the page to try again.'
        );
      }
    } finally {
      if (!signal?.aborted) {
        setPermissionsLoading(false);
      }
    }
  }, []);

  const fetchRequests = useCallback(async (signal) => {
    setRequestsLoading(true);
    setError('');

    try {
      const data = await apiRequest('/requests', { signal });

      setItems(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.requests)
            ? data.requests
            : []
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (!signal?.aborted) {
        setRequestsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchPermissions(controller.signal);
    fetchRequests(controller.signal);

    return () => controller.abort();
  }, [fetchPermissions, fetchRequests]);

  const canApprove = hasPermission(
    permissions,
    'approve_requests'
  );

  const canReject = hasPermission(
    permissions,
    'reject_requests'
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter(
        (item) => item.status === 'pending'
      ).length,
      approved: items.filter(
        (item) => item.status === 'approved'
      ).length,
      rejected: items.filter(
        (item) => item.status === 'rejected'
      ).length,
    }),
    [items]
  );

  const groups = useMemo(() => {
    const visible =
      statusFilter === 'all'
        ? items
        : items.filter(
            (item) => item.status === statusFilter
          );

    const byGroup = new Map();

    visible.forEach((item) => {
      const groupKey = item.group_id ?? 'no-group';

      if (!byGroup.has(groupKey)) {
        byGroup.set(groupKey, {
          id: groupKey,
          name:
            item.group_name ||
            `Group #${item.group_id ?? 'unknown'}`,
          requests: [],
        });
      }

      byGroup.get(groupKey).requests.push(item);
    });

    return [...byGroup.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items, statusFilter]);

  const selected =
    items.find((item) => item.id === selectedId) || null;

  const closeModal = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleReviewed = (updated) => {
    if (!updated || updated.id == null) return;

    setItems((current) =>
      current.map((item) =>
        item.id === updated.id
          ? { ...item, ...updated }
          : item
      )
    );
  };

  const handleDelete = async (item) => {
    const requestType =
      TYPE_LABELS[item.request_type] ||
      item.request_type ||
      'request';

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${requestType.toLowerCase()}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError('');

    try {
      await apiRequest(`/requests/${item.id}`, {
        method: 'DELETE',
      });

      setItems((current) =>
        current.filter((request) => request.id !== item.id)
      );

      if (selectedId === item.id) {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete the request.');
    } finally {
      setDeletingId(null);
    }
  };

  const loading = requestsLoading || permissionsLoading;

  return (
    <div style={ui.page}>
      <header>
        <h1 style={ui.title}>Requests</h1>

        <p style={ui.subtitle}>
          Requests from group leaders, organised by group. Select a
          request to see its details.
        </p>
      </header>

      {error && (
        <p style={alertBox('error')} role="alert">
          {error}
        </p>
      )}

      {permissionsError && (
        <div>
          <p style={alertBox('error')} role="alert">
            {permissionsError}
          </p>

          <button
            type="button"
            style={button('secondary')}
            onClick={() => fetchPermissions()}
          >
            Retry loading permissions
          </button>
        </div>
      )}

      <div
        style={ui.row}
        role="tablist"
        aria-label="Filter by status"
      >
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.value}
            style={tab(statusFilter === filter.value)}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label} ({counts[filter.value]})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={ui.empty}>
          {permissionsLoading
            ? 'Loading administrator permissions...'
            : 'Loading requests...'}
        </p>
      ) : groups.length === 0 ? (
        <p style={ui.empty}>
          {items.length === 0
            ? 'No requests have been submitted yet.'
            : 'No requests match this filter.'}
        </p>
      ) : (
        groups.map((group) => {
          const pendingCount = group.requests.filter(
            (item) => item.status === 'pending'
          ).length;

          return (
            <section
              key={group.id}
              style={ui.card}
              aria-label={`${group.name} requests`}
            >
              <div style={ui.cardHeader}>
                <h2 style={ui.cardTitle}>{group.name}</h2>

                <span
                  style={{
                    fontSize: '0.85rem',
                    color: '#475569',
                  }}
                >
                  {group.requests.length} request
                  {group.requests.length === 1 ? '' : 's'}
                  {pendingCount > 0
                    ? ` · ${pendingCount} pending`
                    : ''}
                </span>
              </div>

              <div style={ui.grid}>
                {group.requests.map((item) => (
                  <RequestTile
                    key={item.id}
                    item={item}
                    onOpen={setSelectedId}
                    onDelete={handleDelete}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {selected && (
        <RequestModal
          key={selected.id}
          item={selected}
          onClose={closeModal}
          onReviewed={handleReviewed}
          canApprove={canApprove}
          canReject={canReject}
        />
      )}
    </div>
  );
}