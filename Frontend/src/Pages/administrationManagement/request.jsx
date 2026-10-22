import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
      : options.headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Something went wrong');
  }

  return data;
}

// Supports permissions returned either as strings or objects.
const hasPermission = (permissions, permissionName) =>
  permissions.some((permission) =>
    typeof permission === 'string'
      ? permission === permissionName
      : permission?.name === permissionName
  );

const TYPE_LABELS = {
  event: 'Event',
  user: 'New member',
  leader_assignment: 'Leader assignment',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES = {
  pending: { background: '#fef3c7', color: '#92400e', border: '#fde68a' },
  approved: { background: '#dcfce7', color: '#166534', border: '#86efac' },
  rejected: { background: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

/* ---------- formatting ---------- */

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// Formats the event's local date and time without timezone conversion.
const formatEventTime = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(
    value || ''
  );

  if (!match) return value || '';

  const [, year, month, day, hour, minute] = match.map((part, index) =>
    index === 0 ? part : Number(part)
  );

  return new Date(year, month - 1, day, hour, minute).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : '';

// Short summary shown on a tile.
const describe = (item) => {
  const data = item.request_data || {};

  if (item.request_type === 'event') {
    return {
      title: data.title || 'Untitled event',
      detail: data.start_datetime ? formatEventTime(data.start_datetime) : '',
    };
  }

  if (item.request_type === 'user') {
    return {
      title: data.full_name || 'New member',
      detail: data.email || '',
    };
  }

  if (item.request_type === 'leader_assignment') {
    return {
      title: `Member #${data.target_user_id}`,
      detail: data.requested_role
        ? `Promote to ${data.requested_role}`
        : '',
    };
  }

  return {
    title: TYPE_LABELS[item.request_type] || item.request_type,
    detail: '',
  };
};

// Full details shown in the modal.
const detailRows = (item) => {
  const data = item.request_data || {};

  if (item.request_type === 'event') {
    return [
      ['Title', data.title],
      ['Description', data.description],
      ['Location', data.location],
      ['Starts', formatEventTime(data.start_datetime)],
      ['Ends', formatEventTime(data.end_datetime)],
    ];
  }

  if (item.request_type === 'user') {
    return [
      ['Full name', data.full_name],
      ['Email', data.email],
      ['Phone', data.phone],
      ['Requested role', data.requested_role],
    ];
  }

  if (item.request_type === 'leader_assignment') {
    return [
      ['Member ID', data.target_user_id],
      ['Requested role', data.requested_role],
    ];
  }

  return [];
};

/* ---------- inline styles ---------- */

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
  ...(variant === 'approve' && { background: '#16a34a', color: '#fff' }),
  ...(variant === 'reject' && { background: '#dc2626', color: '#fff' }),
  ...(variant === 'secondary' && {
    background: '#e2e8f0',
    color: '#0f172a',
  }),
  ...(variant === 'dark' && { background: '#0f172a', color: '#fff' }),
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

/* ---------- small components ---------- */

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
    ([, value]) => value !== null && value !== undefined && value !== ''
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

// One clickable request in the grid.
function RequestTile({ item, onOpen }) {
  const [active, setActive] = useState(false);
  const { title, detail } = describe(item);

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        padding: 16,
        textAlign: 'left',
        font: 'inherit',
        color: '#0f172a',
        cursor: 'pointer',
        background: active ? '#ffffff' : '#f8fafc',
        border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: 12,
        boxShadow: active
          ? '0 8px 20px rgba(37, 99, 235, 0.12)'
          : 'none',
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
        {item.requested_by_name ? `by ${item.requested_by_name} · ` : ''}
        {formatDateTime(item.created_at)}
      </span>
    </button>
  );
}

// The details window for one request.
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
      const updated = await apiRequest(`/requests/${item.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({
          review_note: note.trim() || undefined,
        }),
      });

      onReviewed(updated);
      setMessage(`Request ${updated.status}.`);
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
                ['Reviewed', formatDateTime(item.reviewed_at)],
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

/* ---------- page ---------- */

export default function AdministrationRequestsPage() {
  const [items, setItems] = useState([]);

  const [requestsLoading, setRequestsLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [error, setError] = useState('');
  const [permissionsError, setPermissionsError] = useState('');

  const [permissions, setPermissions] = useState([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  // Fetch the logged-in administrator's assigned permissions.
  const fetchPermissions = useCallback(async (signal) => {
    setPermissionsLoading(true);
    setPermissionsError('');

    try {
      const data = await apiRequest('/user-permissions/me', { signal });

      if (!Array.isArray(data.permissions)) {
        throw new Error('The permissions response is invalid.');
      }

      setPermissions(data.permissions);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch administrator permissions:', err);
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

  // Fetch requests.
  const fetchRequests = useCallback(async (signal) => {
    setRequestsLoading(true);
    setError('');

    try {
      const data = await apiRequest('/requests', { signal });
      setItems(Array.isArray(data) ? data : []);
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

  // Check the permissions assigned to the currently logged-in administrator.
  const canApprove = hasPermission(permissions, 'approve_requests');
  const canReject = hasPermission(permissions, 'reject_requests');

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
    }),
    [items]
  );

  // Requests grouped by group, with groups in alphabetical order.
  const groups = useMemo(() => {
    const visible =
      statusFilter === 'all'
        ? items
        : items.filter((item) => item.status === statusFilter);

    const byGroup = new Map();

    visible.forEach((item) => {
      if (!byGroup.has(item.group_id)) {
        byGroup.set(item.group_id, {
          id: item.group_id,
          name: item.group_name || `Group #${item.group_id}`,
          requests: [],
        });
      }

      byGroup.get(item.group_id).requests.push(item);
    });

    return [...byGroup.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items, statusFilter]);

  const selected = items.find((item) => item.id === selectedId) || null;

  const closeModal = useCallback(() => setSelectedId(null), []);

  // Merge the updated request into the existing row.
  const handleReviewed = (updated) => {
    setItems((current) =>
      current.map((item) =>
        item.id === updated.id ? { ...item, ...updated } : item
      )
    );
  };

  // Wait until both requests and permissions have loaded before displaying
  // the request records.
  const loading = requestsLoading || permissionsLoading;

  return (
    <div style={ui.page}>
      <header>
        <h1 style={ui.title}>Requests</h1>

        <p style={ui.subtitle}>
          Requests from group leaders, organised by group. Select a request
          to see its details.
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

      <div style={ui.row} role="tablist" aria-label="Filter by status">
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

                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {group.requests.length} request
                  {group.requests.length === 1 ? '' : 's'}
                  {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
                </span>
              </div>

              <div style={ui.grid}>
                {group.requests.map((item) => (
                  <RequestTile
                    key={item.id}
                    item={item}
                    onOpen={setSelectedId}
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