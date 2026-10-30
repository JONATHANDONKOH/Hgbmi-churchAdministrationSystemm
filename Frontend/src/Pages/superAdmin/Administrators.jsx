
import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const REQUEST_TYPES = [
  { value: '', label: 'All request types' },
  { value: 'user', label: 'User registration' },
  { value: 'leader_assignment', label: 'Leader assignment' },
  { value: 'group_creation', label: 'Group creation' },
  { value: 'event', label: 'Event' },
  { value: 'meeting', label: 'Meeting' },
];

const formatRole = (role) =>
  String(role || 'Not assigned')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatRequestType = (type) => {
  const found = REQUEST_TYPES.find((item) => item.value === type);
  return found?.label || formatRole(type);
};

const formatDate = (date) => {
  if (!date) return 'Not available';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }

  return parsedDate.toLocaleString();
};

const formatCount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getRequestDescription = (request) => {
  const data = request?.request_data;

  if (!data) return 'No additional request information';

  if (typeof data === 'string') {
    try {
      return getRequestDescription({
        request_data: JSON.parse(data),
      });
    } catch {
      return data;
    }
  }

  if (typeof data === 'object') {
    const name =
      data.fullName ||
      data.full_name ||
      data.name ||
      data.title ||
      data.email;

    const description =
      data.description ||
      data.reason ||
      data.message ||
      data.event_location;

    if (name && description) {
      return `${name} - ${description}`;
    }

    if (name) return String(name);
    if (description) return String(description);

    return 'Request details available';
  }

  return String(data);
};

export default function SuperAdminAdministrators() {
  const [searchTerm, setSearchTerm] = useState('');
  const [adminData, setAdminData] = useState([]);

  const [overview, setOverview] = useState({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected administrator popup
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminRequests, setAdminRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  const [requestStatus, setRequestStatus] = useState('');
  const [requestType, setRequestType] = useState('');

  // Load administrators and overall request statistics
  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [adminsResponse, overviewResponse] = await Promise.all([
          fetch(`${API_URL}/super-admin/admins`, {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch(`${API_URL}/super-admin/request-overview`, {
            credentials: 'include',
            signal: controller.signal,
          }),
        ]);

        const adminsPayload = await adminsResponse.json().catch(() => null);
        const overviewPayload = await overviewResponse.json().catch(() => null);

        if (!adminsResponse.ok) {
          throw new Error(
            adminsPayload?.message || 'Failed to load administrators'
          );
        }

        if (!overviewResponse.ok) {
          throw new Error(
            overviewPayload?.message || 'Failed to load request overview'
          );
        }

        const admins = Array.isArray(adminsPayload?.data)
          ? adminsPayload.data
          : [];

        const overviewData = overviewPayload?.data || {};

        setAdminData(
          admins.map((item) => ({
            ...item,
            id: item.id,
            name:
              item.full_name ||
              item.name ||
              'Unnamed administrator',
            role: formatRole(item.role),
            status:
              item.status ||
              (item.is_active === false ? 'Inactive' : 'Active'),
            totalReviewed: formatCount(item.total_reviewed),
            approvedRequests: formatCount(item.approved_requests),
            rejectedRequests: formatCount(item.rejected_requests),
            lastReviewedAt: item.last_reviewed_at,
          }))
        );

        setOverview({
          total_requests: formatCount(overviewData.total_requests),
          pending_requests: formatCount(overviewData.pending_requests),
          approved_requests: formatCount(overviewData.approved_requests),
          rejected_requests: formatCount(overviewData.rejected_requests),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, []);

  // Load the selected administrator's activity inside the popup
  useEffect(() => {
    if (!selectedAdmin?.id) {
      setAdminRequests([]);
      return;
    }

    const controller = new AbortController();

    const loadAdminRequests = async () => {
      setRequestLoading(true);
      setRequestError('');

      try {
        const params = new URLSearchParams();

        if (requestStatus) {
          params.set('status', requestStatus);
        }

        if (requestType) {
          params.set('request_type', requestType);
        }

        const query = params.toString();

        const endpoint =
          `${API_URL}/super-admin/admins/${selectedAdmin.id}/requests` +
          (query ? `?${query}` : '');

        const response = await fetch(endpoint, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.message || 'Failed to load administrator requests'
          );
        }

        setAdminRequests(
          Array.isArray(payload?.data) ? payload.data : []
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setRequestError(
            err.message || 'Failed to load administrator activity'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setRequestLoading(false);
        }
      }
    };

    loadAdminRequests();

    return () => controller.abort();
  }, [selectedAdmin, requestStatus, requestType]);

  // Close popup using Escape key
  useEffect(() => {
    if (!selectedAdmin) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeActivity();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAdmin]);

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return adminData.filter((item) => {
      return (
        !query ||
        `${item.name} ${item.role} ${item.email || ''}`
          .toLowerCase()
          .includes(query)
      );
    });
  }, [adminData, searchTerm]);

  const activeCount = adminData.filter(
    (item) => item.status === 'Active'
  ).length;

  const totalReviewed = adminData.reduce(
    (total, item) => total + item.totalReviewed,
    0
  );

  function openActivity(admin) {
    setSelectedAdmin(admin);
    setRequestStatus('');
    setRequestType('');
    setAdminRequests([]);
    setRequestError('');
  }

  function closeActivity() {
    setSelectedAdmin(null);
    setAdminRequests([]);
    setRequestError('');
    setRequestStatus('');
    setRequestType('');
  }

  return (
    <div className="administration-section-page">
      {/* PAGE HEADER */}
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
          <h1 className="administration-title">Administrators</h1>
          <p style={{ color: '#64748b', marginTop: '6px' }}>
            Manage administrators and monitor their activities.
          </p>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search administrators"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fef2f2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* MAIN DASHBOARD STATISTICS */}
      <section
        className="administration-stats"
        aria-label="Administrator statistics"
      >
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total administrators</p>
          <p className="administration-card-value">
            {loading ? '...' : adminData.length}
          </p>
          <p className="administration-card-detail">
            Registered administrators
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Active administrators</p>
          <p className="administration-card-value">
            {loading ? '...' : activeCount}
          </p>
          <p className="administration-card-detail">
            Currently active
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Requests reviewed</p>
          <p className="administration-card-value">
            {loading ? '...' : totalReviewed}
          </p>
          <p className="administration-card-detail">
            Reviews by administrators
          </p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Pending requests</p>
          <p className="administration-card-value">
            {loading ? '...' : overview.pending_requests}
          </p>
          <p className="administration-card-detail">
            Awaiting administrator review
          </p>
        </article>
      </section>

      {/* ADMINISTRATOR DIRECTORY */}
      <section
        className="fellowship-member-panel"
        aria-label="Administrator directory"
      >
        <div className="fellowship-member-panel-header">
          <div>
            <h2>Administrator directory</h2>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>
              Select an administrator to view their complete activity.
            </p>
          </div>

          <span>
            {loading ? 'Loading...' : `${filteredAdmins.length} administrators`}
          </span>
        </div>

        <div className="admin-grid-list">
          {loading ? (
            <p style={{ color: '#64748b' }}>
              Loading administrators...
            </p>
          ) : error ? (
            <p style={{ color: '#b91c1c' }}>
              Unable to load administrators.
            </p>
          ) : filteredAdmins.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              {adminData.length === 0
                ? 'No administrators have been added yet.'
                : 'No administrator matches your search.'}
            </p>
          ) : (
            filteredAdmins.map((admin) => (
              <article
                key={admin.id}
                className="admin-grid-item"
              >
                <div className="admin-grid-item-top">
                  <div
                    className="fellowship-member-avatar"
                    style={{
                      width: '46px',
                      height: '46px',
                    }}
                  >
                    {admin.name.charAt(0).toUpperCase()}
                  </div>

                  <span
                    className={`fellowship-member-status ${
                      admin.status === 'Active'
                        ? 'status-present'
                        : 'status-absent'
                    }`}
                  >
                    {admin.status}
                  </span>
                </div>

                <h3
                  style={{
                    margin: '12px 0 4px',
                    color: '#111827',
                    fontSize: '1.05rem',
                  }}
                >
                  {admin.name}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '0.9rem',
                  }}
                >
                  {admin.role}
                </p>

                {admin.email && (
                  <p
                    style={{
                      margin: '6px 0',
                      color: '#64748b',
                      fontSize: '0.82rem',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {admin.email}
                  </p>
                )}

                <div className="admin-grid-item-body">
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Requests reviewed
                  </span>

                  <strong
                    style={{
                      color: '#111827',
                      fontSize: '1.3rem',
                    }}
                  >
                    {admin.totalReviewed}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => openActivity(admin)}
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    padding: '11px 14px',
                    border: 'none',
                    borderRadius: '7px',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View Activity
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ADMINISTRATOR ACTIVITY POPUP */}
      {selectedAdmin && (
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeActivity();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-activity-title"
            style={{
              width: '100%',
              maxWidth: '1050px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* POPUP HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '18px',
              }}
            >
              <div>
                <p className="administration-eyebrow">
                  Administrator activity
                </p>

                <h2
                  id="admin-activity-title"
                  style={{
                    margin: '5px 0',
                    color: '#111827',
                  }}
                >
                  {selectedAdmin.name}
                </h2>

                <p style={{ color: '#64748b', margin: 0 }}>
                  {selectedAdmin.role}
                  {selectedAdmin.email
                    ? ` • ${selectedAdmin.email}`
                    : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={closeActivity}
                aria-label="Close administrator activity"
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#334155',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  fontSize: '22px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* ADMINISTRATOR STATISTICS */}
            <section
              className="administration-stats"
              style={{ marginTop: '20px' }}
            >
              <article className="administration-card fellowship-summary-card">
                <p className="administration-card-label">Total reviewed</p>
                <p className="administration-card-value">
                  {selectedAdmin.totalReviewed}
                </p>
                <p className="administration-card-detail">
                  Requests handled
                </p>
              </article>

              <article className="administration-card fellowship-summary-card">
                <p className="administration-card-label">Approved</p>
                <p className="administration-card-value">
                  {selectedAdmin.approvedRequests}
                </p>
                <p className="administration-card-detail">
                  Approved requests
                </p>
              </article>

              <article className="administration-card fellowship-summary-card">
                <p className="administration-card-label">Rejected</p>
                <p className="administration-card-value">
                  {selectedAdmin.rejectedRequests}
                </p>
                <p className="administration-card-detail">
                  Rejected requests
                </p>
              </article>

              <article className="administration-card fellowship-summary-card">
                <p className="administration-card-label">Last reviewed</p>
                <p
                  style={{
                    color: '#111827',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    margin: '12px 0',
                  }}
                >
                  {formatDate(selectedAdmin.lastReviewedAt)}
                </p>
                <p className="administration-card-detail">
                  Most recent review
                </p>
              </article>
            </section>

            {/* REQUEST FILTERS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                margin: '24px 0 16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>
                  Reviewed requests
                </h3>
                <p style={{ margin: '5px 0 0', color: '#64748b' }}>
                  View the requests handled by this administrator.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <select
                  value={requestStatus}
                  onChange={(event) => setRequestStatus(event.target.value)}
                  aria-label="Filter by status"
                  style={{
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={requestType}
                  onChange={(event) => setRequestType(event.target.value)}
                  aria-label="Filter by request type"
                  style={{
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                  }}
                >
                  {REQUEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* REQUEST LIST */}
            {requestLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                Loading reviewed requests...
              </div>
            ) : requestError ? (
              <div
                role="alert"
                style={{
                  padding: '14px',
                  color: '#b91c1c',
                  background: '#fef2f2',
                  borderRadius: '8px',
                }}
              >
                {requestError}
              </div>
            ) : adminRequests.length === 0 ? (
              <div
                style={{
                  padding: '35px 15px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: '10px',
                }}
              >
                <h3 style={{ color: '#334155' }}>
                  No reviewed requests found
                </h3>
                <p>
                  This administrator has no requests matching the selected filters.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                }}
              >
                {adminRequests.map((request) => (
                  <article
                    key={request.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      background: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '12px',
                      }}
                    >
                      <strong style={{ color: '#111827' }}>
                        Request #{request.id}
                      </strong>

                      <span
                        className={`fellowship-member-status ${
                          request.status === 'approved'
                            ? 'status-present'
                            : 'status-absent'
                        }`}
                      >
                        {formatRole(request.status)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '0 0 8px',
                        color: '#334155',
                        fontWeight: 600,
                      }}
                    >
                      {formatRequestType(request.request_type)}
                    </p>

                    <p
                      style={{
                        margin: '0 0 12px',
                        color: '#64748b',
                        fontSize: '0.9rem',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {getRequestDescription(request)}
                    </p>

                    <div
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '10px',
                        display: 'grid',
                        gap: '7px',
                        fontSize: '0.82rem',
                        color: '#64748b',
                      }}
                    >
                      <span>
                        Requested by:{' '}
                        <strong style={{ color: '#334155' }}>
                          {request.requested_by_name || 'Unknown user'}
                        </strong>
                      </span>

                      <span>
                        Group:{' '}
                        <strong style={{ color: '#334155' }}>
                          {request.group_name || 'Not specified'}
                        </strong>
                      </span>

                      <span>
                        Submitted:{' '}
                        <strong style={{ color: '#334155' }}>
                          {formatDate(request.created_at)}
                        </strong>
                      </span>

                      <span>
                        Reviewed:{' '}
                        <strong style={{ color: '#334155' }}>
                          {formatDate(request.reviewed_at)}
                        </strong>
                      </span>

                      {request.review_note && (
                        <span>
                          Review note:{' '}
                          <strong style={{ color: '#334155' }}>
                            {request.review_note}
                          </strong>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* POPUP FOOTER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid #e2e8f0',
                marginTop: '24px',
                paddingTop: '16px',
              }}
            >
              <button
                type="button"
                onClick={closeActivity}
                style={{
                  padding: '10px 22px',
                  border: 'none',
                  borderRadius: '7px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
