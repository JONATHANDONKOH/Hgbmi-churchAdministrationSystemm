import { useCallback, useEffect, useMemo, useState } from 'react';

import SearchBar from '../../component/searchBar';
import { Create } from '../../component/button';

import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const ROLE_REQUEST_TYPE = 'leader_assignment';

const requestStyles = {
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
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  button: {
    border: 0,
    borderRadius: '8px',
    padding: '10px 15px',
    background: '#253b80',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    padding: '10px 15px',
    background: '#fff',
    color: '#344054',
    cursor: 'pointer',
    fontWeight: 600,
  },
  muted: {
    color: '#667085',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  infoPanel: {
    background: '#f9fafb',
    border: '1px solid #eaecf0',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '18px',
  },
  infoRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '9px',
    fontSize: '14px',
  },
  infoLabel: {
    color: '#667085',
    fontWeight: 600,
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
  },
  modal: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,.2)',
    color: '#172033',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  badgePending: {
    background: '#fffaeb',
    color: '#b54708',
  },
  badgeApproved: {
    background: '#ecfdf3',
    color: '#027a48',
  },
  badgeRejected: {
    background: '#fef3f2',
    color: '#b42318',
  },
};

function getRoleLabel(role) {
  const normalized = String(role || '').trim();

  if (!normalized) return 'Member';

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function getMemberId(member) {
  return member?.id ?? member?.user_id ?? member?._id;
}

function getMemberName(member) {
  return member?.full_name || member?.name || '';
}

function getMemberPhone(member) {
  return member?.phone_number || member?.phone || '';
}

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

function getLatestRequestForMember(requests, memberId, groupId) {
  const matches = requests.filter((request) => {
    const requestData = getRequestData(request);

    return (
      request.request_type === ROLE_REQUEST_TYPE &&
      String(request.group_id) === String(groupId) &&
      String(requestData.target_user_id) === String(memberId)
    );
  });

  if (!matches.length) return null;

  return [...matches].sort(
    (a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )[0];
}

function getRequestStatus(request, member) {
  if (!request) return null;

  const status = String(request.status || 'pending').toLowerCase();

  if (status === 'approved') return 'approved';

  if (status === 'rejected' || status === 'declined') {
    return 'rejected';
  }

  const requestedRole = normalizeRole(
    getRequestData(request).requested_role
  );

  if (
    requestedRole &&
    requestedRole === normalizeRole(member?.role)
  ) {
    return 'approved';
  }

  return 'pending';
}

function getSimpleRequestStatus(request) {
  const status = String(request?.status || 'pending').toLowerCase();

  if (status === 'approved') return 'approved';

  if (status === 'rejected' || status === 'declined') {
    return 'rejected';
  }

  return 'pending';
}

function RequestStatusBadge({ status, requestedRole }) {
  if (!status) return null;

  const variants = {
    pending: {
      style: requestStyles.badgePending,
      label: 'Pending approval',
    },
    approved: {
      style: requestStyles.badgeApproved,
      label: requestedRole
        ? `Approved: ${getRoleLabel(requestedRole)}`
        : 'Approved',
    },
    rejected: {
      style: requestStyles.badgeRejected,
      label: 'Rejected',
    },
  };

  const variant = variants[status];

  return (
    <span style={{ ...requestStyles.badge, ...variant.style }}>
      {variant.label}
    </span>
  );
}

export default function CellMembersPage({ groupId }) {
  // Create member state
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Role request modal state
  const [detailMember, setDetailMember] = useState(null);
  const [editableRole, setEditableRole] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // Members list state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Requests submitted by the logged-in user
  const [myRequests, setMyRequests] = useState([]);

  // Logged-in user ID
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  // Fetch current logged-in user
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to fetch current user (${response.status})`
          );
        }

        const data = await response.json();
        const user = data.user || data;
        const userId =
          user.id ?? user.user_id ?? user.userId ?? null;

        setLoggedInUserId(
          userId == null ? null : String(userId)
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch current user error:', err);
        }
      }
    }

    fetchCurrentUser();

    return () => controller.abort();
  }, []);

  // Fetch members belonging to the current cell
  const fetchMembers = useCallback(async (signal) => {
    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setMembers([]);
      setLoadingMembers(false);
      setMembersError('');
      return;
    }

    try {
      setLoadingMembers(true);
      setMembersError('');

      const response = await fetch(
        `${API_URL}/api/user-groups/group/${groupId}/members`,
        {
          method: 'GET',
          credentials: 'include',
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch cell members (${response.status})`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid cell members response');
      }

      setMembers(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch cell members error:', err);
        setMembers([]);
        setMembersError(
          'Unable to load members for this cell.'
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingMembers(false);
      }
    }
  }, [groupId]);

  useEffect(() => {
    const controller = new AbortController();

    fetchMembers(controller.signal);

    return () => controller.abort();
  }, [fetchMembers]);

  // Fetch requests submitted by the logged-in user
  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/requests/mine`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error(
          'Failed to fetch my requests:',
          response.status
        );
        return;
      }

      const data = await response.json().catch(() => []);

      setMyRequests(
        Array.isArray(data)
          ? data
          : data?.requests || data?.data || []
      );
    } catch (err) {
      console.error('Fetch my requests error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Refresh when the browser tab regains focus
  useEffect(() => {
    const refreshOnFocus = () => {
      fetchMembers();
      fetchMyRequests();
    };

    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [fetchMembers, fetchMyRequests]);

  // Pending and rejected membership requests for this cell
  const membershipRequests = useMemo(() => {
    return myRequests
      .filter(
        (request) =>
          request.request_type === 'user' &&
          String(request.group_id) === String(groupId) &&
          getSimpleRequestStatus(request) !== 'approved'
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
  }, [myRequests, groupId]);

  // Hide the logged-in user
  const isLoggedInUser = (member) => {
    const memberId = getMemberId(member);

    return (
      loggedInUserId !== null &&
      memberId !== undefined &&
      memberId !== null &&
      String(memberId) === String(loggedInUserId)
    );
  };

  // Filter approved members
  const filteredMembers = members.filter((member) => {
    if (isLoggedInUser(member)) return false;

    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    const name = getMemberName(member);
    const email = member.email || '';
    const role = member.role || '';
    const phone = getMemberPhone(member);

    return `${name} ${email} ${role} ${phone}`
      .toLowerCase()
      .includes(search);
  });

  // Filter pending and rejected membership requests
  const filteredRequests = membershipRequests.filter((request) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    const data = getRequestData(request);

    return `${data.full_name || ''} ${data.email || ''} ${
      data.phone || data.phone_number || ''
    }`
      .toLowerCase()
      .includes(search);
  });

  const totalShown =
    filteredMembers.length + filteredRequests.length;

  const totalMembers = members.filter(
    (member) => !isLoggedInUser(member)
  ).length;

  const tableCellStyle = {
    padding: '12px 10px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'middle',
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(15, 23, 42, 0.55)',
      overflowY: 'auto',
    },
    modal: {
      width: '100%',
      maxWidth: '520px',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto',
      padding: '26px',
      borderRadius: '16px',
      background: '#fff',
      color: '#111827',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      boxSizing: 'border-box',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
      marginBottom: '24px',
    },
    eyebrow: {
      margin: '0 0 6px',
      color: '#6b7280',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    title: {
      margin: '4px 0 8px',
      fontSize: '22px',
    },
    description: {
      margin: 0,
      color: '#6b7280',
      fontSize: '14px',
      lineHeight: 1.5,
    },
    closeButton: {
      border: 'none',
      background: 'transparent',
      color: '#6b7280',
      fontSize: '28px',
      cursor: 'pointer',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: '7px',
      marginBottom: '18px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 13px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      background: '#fff',
      color: '#111827',
      font: 'inherit',
      outline: 'none',
    },
    hint: {
      color: '#6b7280',
      fontSize: '12px',
      lineHeight: 1.5,
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '24px',
    },
    cancelButton: {
      padding: '11px 17px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      background: '#fff',
      color: '#374151',
      font: 'inherit',
      fontWeight: 600,
      cursor: 'pointer',
    },
    submitButton: {
      padding: '11px 17px',
      border: '1px solid #374151',
      borderRadius: '8px',
      background: '#374151',
      color: '#fff',
      font: 'inherit',
      fontWeight: 600,
      cursor: 'pointer',
    },
    error: {
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: '#fef2f2',
      color: '#b91c1c',
      fontSize: '14px',
    },
    success: {
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: '#ecfdf5',
      color: '#065f46',
      fontSize: '14px',
    },
    empty: {
      padding: '24px',
      color: '#6b7280',
      textAlign: 'center',
    },
    loadingText: {
      padding: '24px',
      color: '#6b7280',
      textAlign: 'center',
    },
  };

  // Handle create-member form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const closeForm = () => {
    if (loading) return;

    setShowForm(false);
    setError('');
  };

  // Submit a prospective cell member request
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setError('The cell group ID is missing or invalid.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: 'user',
          group_id: Number(groupId),
          request_data: {
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            password: formData.password,
          },
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to submit membership request.'
        );
      }

      setSuccess(
        'Cell membership request submitted for administrator approval.'
      );

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
      });

      setShowForm(false);

      await fetchMyRequests();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Open the role request modal for a selected cell member
  const handleMemberClick = (member) => {
    setDetailMember(member);
    setEditableRole('');
    setRequestMessage('');
    setRequestError('');
  };

  // Submit a role assignment request
  const handleSendRequest = async () => {
    if (!detailMember) return;

    setRequestError('');
    setRequestMessage('');

    const requestedRole = normalizeRole(editableRole);
    const targetUserId = getMemberId(detailMember);

    if (
      !groupId ||
      !Number.isSafeInteger(Number(groupId)) ||
      Number(groupId) <= 0
    ) {
      setRequestError('The cell group ID is missing or invalid.');
      return;
    }

    if (
      !targetUserId ||
      !Number.isSafeInteger(Number(targetUserId)) ||
      Number(targetUserId) <= 0
    ) {
      setRequestError('Unable to identify the selected user.');
      return;
    }

    if (!requestedRole) {
      setRequestError('Please enter the requested role.');
      return;
    }

    if (requestedRole.length > 60) {
      setRequestError('The role cannot exceed 60 characters.');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(requestedRole)) {
      setRequestError(
        'Use letters, numbers, underscores or hyphens. Use underscores between words.'
      );
      return;
    }

    const requestData = {
      target_user_id: Number(targetUserId),
      full_name: getMemberName(detailMember),
      email: detailMember.email || '',
      phone_number: getMemberPhone(detailMember),
      current_role: detailMember.role || 'member',
      requested_role: requestedRole,
    };

    try {
      setRequestLoading(true);

      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: ROLE_REQUEST_TYPE,
          group_id: Number(groupId),
          request_data: requestData,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to send the role request.'
        );
      }

      setRequestMessage(
        'Role assignment request submitted for administrator approval.'
      );

      await fetchMyRequests();
    } catch (err) {
      console.error('Submit cell role request error:', err);

      setRequestError(
        err.message || 'Something went wrong.'
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const closeRequestModal = () => {
    if (requestLoading) return;

    setDetailMember(null);
    setRequestMessage('');
    setRequestError('');
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Cell</p>
          <h1>Members</h1>
        </div>

        <div className="dashboard-actions">
          <SearchBar
            placeholder="Search cell members"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="button"
            className="my-button"
            style={{ background: '#374151' }}
            onClick={() => window.print()}
          >
            Export
          </button>

          <Create
            label="Create Member"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowForm(true);
            }}
          />
        </div>
      </header>

      {success && (
        <div style={styles.success} role="status">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div style={styles.error} role="alert">
          {error}
        </div>
      )}

      {membersError && (
        <div style={styles.error} role="alert">
          {membersError}
        </div>
      )}

      <section
        className="administration-stats"
        aria-label="Cell members summary"
      >
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">
            Total members
          </p>

          <p className="administration-card-value">
            {loadingMembers ? '—' : totalMembers}
          </p>

          <p className="administration-card-detail">
            Approved members in this cell
          </p>
        </article>
      </section>

      <section
        className="fellowship-member-panel"
        aria-label="Cell members and requests"
      >
        <div className="fellowship-member-panel-header">
          <h2>Cell Members and Requests</h2>

          <span>
            {loadingMembers ? 'Loading...' : `${totalShown} shown`}
          </span>
        </div>

        <div
          className="fellowship-member-list"
          style={{ padding: '0 16px 16px' }}
        >
          {loadingMembers ? (
            <p style={styles.loadingText}>
              Loading cell members...
            </p>
          ) : membersError ? (
            <p style={styles.empty}>
              Unable to display cell members.
            </p>
          ) : totalShown === 0 ? (
            <p style={styles.empty}>
              {members.length === 0 &&
              membershipRequests.length === 0
                ? 'No members or requests to display.'
                : 'No members or requests match your search.'}
            </p>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '850px',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Member',
                      'Email',
                      'Phone',
                      'Role',
                      'Status',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid #e5e7eb',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((member) => {
                    const name =
                      getMemberName(member) || 'Unknown';

                    const email = member.email || '—';

                    const phone =
                      getMemberPhone(member) || '—';

                    const role = member.role || 'member';

                    const status = member.status || 'Active';

                    const memberKey = getMemberId(member);

                    const latestRequest =
                      getLatestRequestForMember(
                        myRequests,
                        getMemberId(member),
                        groupId
                      );

                    const requestStatus = getRequestStatus(
                      latestRequest,
                      member
                    );

                    const isPending =
                      requestStatus === 'pending';

                    return (
                      <tr key={`member-${memberKey}`}>
                        <td style={tableCellStyle}>
                          <div className="fellowship-member-meta">
                            <div className="fellowship-member-avatar">
                              {name.charAt(0).toUpperCase()}
                            </div>

                            <span className="fellowship-member-name">
                              {name}
                            </span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>{email}</td>

                        <td style={tableCellStyle}>{phone}</td>

                        <td style={tableCellStyle}>
                          {getRoleLabel(role)}
                        </td>

                        <td style={tableCellStyle}>
                          <span
                            className={`fellowship-member-status ${
                              status === 'Present' ||
                              status === 'Active'
                                ? 'status-present'
                                : 'status-absent'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <RequestStatusBadge
                              status={requestStatus}
                              requestedRole={
                                getRequestData(latestRequest)
                                  .requested_role
                              }
                            />

                            <button
                              type="button"
                              style={{
                                ...requestStyles.button,
                                opacity: isPending ? 0.5 : 1,
                                cursor: isPending
                                  ? 'not-allowed'
                                  : 'pointer',
                              }}
                              onClick={() =>
                                handleMemberClick(member)
                              }
                              disabled={isPending}
                            >
                              Request role
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRequests.map((request) => {
                    const data = getRequestData(request);

                    const name =
                      data.full_name || 'Unnamed member';

                    const requestStatus =
                      getSimpleRequestStatus(request);

                    return (
                      <tr key={`request-${request.id}`}>
                        <td style={tableCellStyle}>
                          <div className="fellowship-member-meta">
                            <div className="fellowship-member-avatar">
                              {name.charAt(0).toUpperCase()}
                            </div>

                            <span className="fellowship-member-name">
                              {name}
                            </span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          {data.email || '—'}
                        </td>

                        <td style={tableCellStyle}>
                          {data.phone_number ||
                            data.phone ||
                            '—'}
                        </td>

                        <td style={tableCellStyle}>
                          Member
                        </td>

                        <td style={tableCellStyle}>
                          <span className="fellowship-member-status status-absent">
                            {requestStatus === 'rejected'
                              ? 'Rejected'
                              : 'Pending approval'}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <RequestStatusBadge
                            status={requestStatus}
                          />

                          {requestStatus === 'rejected' &&
                            request.review_note && (
                              <p style={requestStyles.muted}>
                                {request.review_note}
                              </p>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* CREATE MEMBER MODAL */}
      {showForm && (
        <div
          style={styles.backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-member-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>Cell</p>

                <h2
                  id="create-member-title"
                  style={styles.title}
                >
                  Create Member Request
                </h2>

                <p style={styles.description}>
                  Enter the prospective member's details for
                  administrator approval.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={closeForm}
                disabled={loading}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            {error && (
              <div style={styles.error} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label
                  htmlFor="full_name"
                  style={styles.label}
                >
                  Full name
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  autoComplete="name"
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="email"
                  style={styles.label}
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  autoComplete="email"
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="phone"
                  style={styles.label}
                >
                  Phone number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  autoComplete="tel"
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="password"
                  style={styles.label}
                >
                  Initial password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />

                <small style={styles.hint}>
                  This password will be used when the membership
                  request is approved.
                </small>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeForm}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    opacity: loading ? 0.65 : 1,
                  }}
                  disabled={loading}
                >
                  {loading
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ROLE ASSIGNMENT REQUEST MODAL */}
      {detailMember && (
        <div
          style={requestStyles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeRequestModal();
            }
          }}
        >
          <div
            style={requestStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
          >
            <div style={requestStyles.modalHeader}>
              <h2
                id="request-modal-title"
                style={{
                  margin: 0,
                  fontSize: '20px',
                }}
              >
                Request Member Role
              </h2>

              <button
                type="button"
                style={requestStyles.secondaryButton}
                onClick={closeRequestModal}
                disabled={requestLoading}
              >
                Close
              </button>
            </div>

            <h3
              style={{
                fontSize: '15px',
                marginBottom: '10px',
              }}
            >
              Selected member information
            </h3>

            <div style={requestStyles.infoPanel}>
              <div style={requestStyles.infoRow}>
                <span style={requestStyles.infoLabel}>
                  Member ID:
                </span>

                <span>
                  {getMemberId(detailMember) ?? '—'}
                </span>
              </div>

              <div style={requestStyles.infoRow}>
                <span style={requestStyles.infoLabel}>
                  Full name:
                </span>

                <span>
                  {getMemberName(detailMember) || '—'}
                </span>
              </div>

              <div style={requestStyles.infoRow}>
                <span style={requestStyles.infoLabel}>
                  Email:
                </span>

                <span>
                  {detailMember.email || '—'}
                </span>
              </div>

              <div style={requestStyles.infoRow}>
                <span style={requestStyles.infoLabel}>
                  Phone:
                </span>

                <span>
                  {getMemberPhone(detailMember) || '—'}
                </span>
              </div>

              <div
                style={{
                  ...requestStyles.infoRow,
                  marginBottom: 0,
                }}
              >
                <span style={requestStyles.infoLabel}>
                  Current role:
                </span>

                <span>
                  {getRoleLabel(detailMember.role)}
                </span>
              </div>
            </div>

            <div style={requestStyles.field}>
              <label
                htmlFor="member-role"
                style={requestStyles.label}
              >
                Requested role *
              </label>

              <input
                id="member-role"
                type="text"
                value={editableRole}
                onChange={(event) =>
                  setEditableRole(event.target.value)
                }
                placeholder="e.g. secretary, treasurer, assistant leader"
                style={requestStyles.input}
                maxLength={60}
                disabled={
                  requestLoading || Boolean(requestMessage)
                }
              />

              <small style={requestStyles.muted}>
                Enter the church position you want this member
                to be considered for. Use underscores between
                words if needed.
              </small>
            </div>

            <p style={requestStyles.muted}>
              This request includes the selected member's
              information and the requested role. The
              administrator must approve the request before
              the member's role is changed.
            </p>

            {requestError && (
              <div
                style={{
                  padding: '11px 13px',
                  borderRadius: '8px',
                  margin: '12px 0',
                  fontSize: '14px',
                  background: '#fef3f2',
                  color: '#b42318',
                }}
                role="alert"
              >
                {requestError}
              </div>
            )}

            {requestMessage && (
              <div
                style={{
                  padding: '11px 13px',
                  borderRadius: '8px',
                  margin: '12px 0',
                  fontSize: '14px',
                  background: '#ecfdf3',
                  color: '#027a48',
                }}
                role="status"
              >
                {requestMessage}
              </div>
            )}

            <button
              type="button"
              style={{
                ...requestStyles.button,
                width: '100%',
                opacity:
                  requestLoading || Boolean(requestMessage)
                    ? 0.6
                    : 1,
              }}
              onClick={handleSendRequest}
              disabled={
                requestLoading || Boolean(requestMessage)
              }
            >
              {requestLoading
                ? 'Submitting...'
                : 'Submit Role Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}