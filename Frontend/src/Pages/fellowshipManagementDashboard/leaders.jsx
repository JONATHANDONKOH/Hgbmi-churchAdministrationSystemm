
import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const MY_GROUPS_ENDPOINT = '/api/groups/mine';
const ALL_GROUPS_ENDPOINT = '/api/groups';
const CURRENT_USER_ENDPOINT = '/api/auth/me';
const MEMBERS_ENDPOINT = '/api/user-groups/group';
const REQUESTS_ENDPOINT = '/api/requests/mine';
const DELETE_GROUP_ENDPOINT = '/api/groups';

const groupTypes = [
  { value: 'cell', label: 'Cell' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'department', label: 'Department' },
];

const ROLE_REQUEST_TYPES = ['leader_assignment', 'group_creation'];

const styles = {
  page: {
    padding: '24px',
    color: '#172033',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  title: { margin: 0, fontSize: '26px', fontWeight: 700 },
  description: {
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '16px',
  },
  label: { fontSize: '14px', fontWeight: 600, color: '#344054' },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
  },
  textInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  textArea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
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
  deleteButton: {
    border: '1px solid #fda29b',
    borderRadius: '8px',
    padding: '9px 12px',
    background: '#fff',
    color: '#b42318',
    cursor: 'pointer',
    fontWeight: 600,
  },
  tableWrap: { overflowX: 'auto', width: '100%' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '900px',
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
  status: {
    padding: '11px 13px',
    borderRadius: '8px',
    margin: '12px 0',
    fontSize: '14px',
  },
  error: { background: '#fef3f2', color: '#b42318' },
  success: { background: '#ecfdf3', color: '#027a48' },
  muted: { color: '#667085', fontSize: '14px', lineHeight: 1.5 },
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
  infoLabel: { color: '#667085', fontWeight: 600 },
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
  badgePending: { background: '#fffaeb', color: '#b54708' },
  badgeApproved: { background: '#ecfdf3', color: '#027a48' },
  badgeRejected: { background: '#fef3f2', color: '#b42318' },
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

function getArrayFromResponse(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  return { ok: response.ok, status: response.status, data };
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

function getCurrentUserId(data) {
  const user = data?.user ?? data?.data ?? data;

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

// Gets groups led by the selected member directly under this fellowship.
function getOwnGroups(member, scopedGroups, parentGroupId) {
  const memberId = getMemberId(member);

  if (memberId === null || memberId === undefined) return [];

  return scopedGroups.filter((group) => {
    const leaderId = getGroupLeaderId(group);

    return (
      leaderId !== null &&
      leaderId !== undefined &&
      String(leaderId) === String(memberId) &&
      String(getGroupParentId(group)) === String(parentGroupId) &&
      String(group.id) !== String(parentGroupId)
    );
  });
}

function getOwnGroupName(member, scopedGroups, parentGroupId) {
  const ownGroups = getOwnGroups(member, scopedGroups, parentGroupId);

  if (ownGroups.length) {
    return ownGroups.map((group) => group.name).join(', ');
  }

  return (
    member?.own_group_name ||
    member?.led_group_name ||
    member?.cell_name ||
    ''
  );
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

  let added = true;

  while (added) {
    added = false;

    groups.forEach((group) => {
      const parentId = getGroupParentId(group);

      if (
        parentId !== null &&
        parentId !== undefined &&
        included.has(String(parentId)) &&
        !included.has(String(group.id))
      ) {
        included.add(String(group.id));
        added = true;
      }
    });
  }

  return groups.filter((group) => included.has(String(group.id)));
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

function getLatestRequestForMember(requests, memberId) {
  const matches = requests.filter(
    (request) =>
      ROLE_REQUEST_TYPES.includes(request.request_type) &&
      String(getRequestData(request).target_user_id) === String(memberId)
  );

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

  if (status === 'rejected' || status === 'declined') return 'rejected';

  const requestedRole = normalizeRole(
    getRequestData(request).requested_role
  );

  if (requestedRole && requestedRole === normalizeRole(member?.role)) {
    return 'approved';
  }

  return 'pending';
}

function StatusBadge({ status, requestedRole }) {
  if (!status) return <span style={styles.muted}>—</span>;

  const variants = {
    pending: {
      style: styles.badgePending,
      label: 'Pending approval',
    },
    approved: {
      style: styles.badgeApproved,
      label: requestedRole
        ? `Approved: ${getRoleLabel(requestedRole)}`
        : 'Approved',
    },
    rejected: {
      style: styles.badgeRejected,
      label: 'Rejected',
    },
  };

  const variant = variants[status];

  return (
    <span style={{ ...styles.badge, ...variant.style }}>
      {variant.label}
    </span>
  );
}

export default function FellowshipLeadersPage() {
  const [fellowships, setFellowships] = useState([]);
  const [scopedGroups, setScopedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pageError, setPageError] = useState('');
  const [pageMessage, setPageMessage] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [detailMember, setDetailMember] = useState(null);

  const [requestAction, setRequestAction] = useState('group_creation');
  const [editableRole, setEditableRole] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('cell');
  const [newGroupLocation, setNewGroupLocation] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  const selectedGroupName = useMemo(() => {
    const group = fellowships.find(
      (item) => String(item.id) === String(selectedGroup)
    );

    return group?.name || '';
  }, [fellowships, selectedGroup]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetchJson(CURRENT_USER_ENDPOINT);

      if (response.ok) {
        setCurrentUserId(getCurrentUserId(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch logged-in user:', error);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    setPageError('');

    try {
      let groups = [];
      const mine = await fetchJson(MY_GROUPS_ENDPOINT);

      if (mine.ok) {
        groups = getArrayFromResponse(mine.data, ['groups', 'data']);
      } else {
        const [all, me] = await Promise.all([
          fetchJson(ALL_GROUPS_ENDPOINT),
          fetchJson(CURRENT_USER_ENDPOINT),
        ]);

        if (!all.ok) {
          throw new Error(all.data.error || 'Failed to load groups.');
        }

        const userId = me.ok ? getCurrentUserId(me.data) : null;

        groups =
          userId === null || userId === undefined
            ? []
            : getGroupsUnderUser(
                getArrayFromResponse(all.data, ['groups', 'data']),
                userId
              );
      }

      const fellowshipGroups = groups.filter(
        (group) =>
          String(group.type || '').toLowerCase() === 'fellowship'
      );

      setScopedGroups(groups);
      setFellowships(fellowshipGroups);

      setSelectedGroup((current) => {
        const exists = fellowshipGroups.some(
          (group) => String(group.id) === String(current)
        );

        if (current && exists) return current;

        return fellowshipGroups.length
          ? String(fellowshipGroups[0].id)
          : '';
      });
    } catch (error) {
      setPageError(error.message || 'Failed to load fellowships.');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchGroups();
  }, [fetchCurrentUser, fetchGroups]);

  const fetchMembers = useCallback(async () => {
    if (!selectedGroup) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    setPageError('');

    try {
      const response = await fetchJson(
        `${MEMBERS_ENDPOINT}/${encodeURIComponent(selectedGroup)}/members`
      );

      if (!response.ok) {
        throw new Error(
          response.data.error || 'Failed to load fellowship members.'
        );
      }

      setMembers(
        getArrayFromResponse(response.data, ['members', 'users', 'data'])
      );
    } catch (error) {
      setMembers([]);
      setPageError(error.message || 'Failed to load fellowship members.');
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await fetchJson(REQUESTS_ENDPOINT);

      if (!response.ok) return;

      setMyRequests(
        getArrayFromResponse(response.data, ['requests', 'data'])
      );
    } catch (error) {
      console.error('Fetch my requests error:', error);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  useEffect(() => {
    const refreshOnFocus = () => {
      fetchMembers();
      fetchMyRequests();
    };

    window.addEventListener('focus', refreshOnFocus);

    return () => window.removeEventListener('focus', refreshOnFocus);
  }, [fetchMembers, fetchMyRequests]);

  // Delete a group using DELETE /api/groups/:id.
  const handleDeleteGroup = async (group, member) => {
    if (!group?.id) {
      setPageError('Unable to identify the group to delete.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"?\n\n` +
        `This deletes the group, not the member's user account. ` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    setPageError('');
    setPageMessage('');
    setDeletingGroupId(String(group.id));

    try {
      const response = await fetchJson(
        `${DELETE_GROUP_ENDPOINT}/${encodeURIComponent(group.id)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(
          response.data.error ||
            response.data.message ||
            'Failed to delete the group.'
        );
      }

      setPageMessage(`Group "${group.name}" was deleted successfully.`);

      // Remove the deleted group from the current local list.
      setScopedGroups((previous) =>
        previous.filter((item) => String(item.id) !== String(group.id))
      );

      // If a fellowship itself was deleted, remove it from the selector.
      setFellowships((previous) =>
        previous.filter((item) => String(item.id) !== String(group.id))
      );

      // Refresh data from the backend after successful deletion.
      await fetchGroups();

      // Refresh members of the currently selected fellowship.
      await fetchMembers();

      console.info('Deleted group for member:', getMemberId(member));
    } catch (error) {
      console.error('Delete group error:', error);
      setPageError(error.message || 'Failed to delete the group.');
    } finally {
      setDeletingGroupId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const memberId = getMemberId(member);

      // Exclude the currently logged-in account.
      if (
        currentUserId !== null &&
        currentUserId !== undefined &&
        memberId !== null &&
        memberId !== undefined &&
        String(memberId) === String(currentUserId)
      ) {
        return false;
      }

      if (!search) return true;

      const searchable = [
        member.full_name,
        member.name,
        getOwnGroupName(member, scopedGroups, selectedGroup),
        member.email,
        member.phone_number,
        member.phone,
        member.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [members, searchTerm, scopedGroups, selectedGroup, currentUserId]);

  const handleMemberClick = (member) => {
    setDetailMember(member);
    setRequestAction('group_creation');
    setEditableRole('');
    setNewGroupName('');
    setNewGroupType('cell');
    setNewGroupLocation('');
    setNewGroupDescription('');
    setRequestMessage('');
    setRequestError('');
  };

  const handleSendRequest = async () => {
    if (!detailMember) return;

    setRequestError('');
    setRequestMessage('');

    const requestedRole = normalizeRole(editableRole);
    const targetUserId = getMemberId(detailMember);

    if (!selectedGroup) {
      setRequestError('Please select a fellowship.');
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

    if (requestAction === 'group_creation') {
      if (!newGroupName.trim()) {
        setRequestError('Please enter a name for the new group.');
        return;
      }

      if (newGroupName.trim().length > 150) {
        setRequestError('The group name cannot exceed 150 characters.');
        return;
      }

      if (newGroupLocation.trim().length > 200) {
        setRequestError('The group location cannot exceed 200 characters.');
        return;
      }

      if (newGroupDescription.trim().length > 2000) {
        setRequestError('The group description cannot exceed 2000 characters.');
        return;
      }
    }

    const memberInformation = {
      target_user_id: Number(targetUserId),
      full_name: getMemberName(detailMember),
      email: detailMember.email || '',
      phone_number: getMemberPhone(detailMember),
      current_role: detailMember.role || 'member',
      requested_role: requestedRole,
    };

    const requestData =
      requestAction === 'group_creation'
        ? {
            name: newGroupName.trim(),
            type: newGroupType,
            parent_group_id: Number(selectedGroup),
            location: newGroupLocation.trim() || null,
            description: newGroupDescription.trim() || null,
            ...memberInformation,
          }
        : { ...memberInformation };

    const payload = {
      request_type: requestAction,
      group_id: Number(selectedGroup),
      request_data: requestData,
    };

    try {
      setRequestLoading(true);

      const response = await fetchJson('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          response.data.error || 'Failed to send the request.'
        );
      }

      const memberName = getMemberName(detailMember) || 'the selected member';
      const ownGroupName = getOwnGroupName(
        detailMember,
        scopedGroups,
        selectedGroup
      );

      const memberLabel = ownGroupName
        ? `${memberName} (${ownGroupName})`
        : memberName;

      setRequestMessage(
        requestAction === 'group_creation'
          ? `Group creation request for ${memberLabel} submitted for administrator approval.`
          : `Role assignment request for ${memberLabel} submitted for administrator approval.`
      );

      await fetchMyRequests();
    } catch (error) {
      console.error('Submit leadership request error:', error);
      setRequestError(error.message || 'Something went wrong.');
    } finally {
      setRequestLoading(false);
    }
  };

  const closeModal = () => {
    if (requestLoading) return;

    setDetailMember(null);
    setRequestMessage('');
    setRequestError('');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Fellowship Leaders & Members</h1>
          <p style={styles.description}>
            Select a fellowship member, enter the requested church position,
            and submit a request for administrator approval. You can also
            delete groups led by members under the selected fellowship.
          </p>
        </div>
      </div>

      <section style={styles.panel}>
        <div style={styles.field}>
          <label htmlFor="fellowship-select" style={styles.label}>
            Select fellowship
          </label>

          <select
            id="fellowship-select"
            style={styles.select}
            value={selectedGroup}
            onChange={(event) => setSelectedGroup(event.target.value)}
            disabled={loadingGroups || !fellowships.length}
          >
            {!fellowships.length && (
              <option value="">
                {loadingGroups ? 'Loading fellowships...' : 'No fellowships found'}
              </option>
            )}

            {fellowships.map((group) => (
              <option key={group.id} value={String(group.id)}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="member-search" style={styles.label}>
            Search members
          </label>

          <input
            id="member-search"
            type="text"
            style={styles.textInput}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, group, email, phone or role"
          />
        </div>
      </section>

      {pageError && (
        <div role="alert" style={{ ...styles.status, ...styles.error }}>
          {pageError}
        </div>
      )}

      {pageMessage && (
        <div role="status" style={{ ...styles.status, ...styles.success }}>
          {pageMessage}
        </div>
      )}

      <section style={styles.panel}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {selectedGroupName
              ? `${selectedGroupName} members`
              : 'Fellowship members'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={styles.muted}>
              {filteredMembers.length} member
              {filteredMembers.length === 1 ? '' : 's'}
            </span>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                fetchMembers();
                fetchMyRequests();
                fetchGroups();
              }}
              disabled={loadingMembers || loadingGroups}
            >
              Refresh
            </button>
          </div>
        </div>

        {loadingMembers ? (
          <p style={styles.muted}>Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p style={styles.muted}>No members found in this fellowship.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Group</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Current role</th>
                  <th style={styles.th}>Request status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member, index) => {
                  const memberId = getMemberId(member);
                  const latestRequest = getLatestRequestForMember(
                    myRequests,
                    memberId
                  );

                  const requestStatus = getRequestStatus(
                    latestRequest,
                    member
                  );

                  const isPending = requestStatus === 'pending';

                  const ownGroups = getOwnGroups(
                    member,
                    scopedGroups,
                    selectedGroup
                  );

                  return (
                    <tr key={memberId ?? index}>
                      <td style={styles.td}>
                        {getMemberName(member) || 'Unnamed member'}
                      </td>

                      <td style={styles.td}>
                        {getOwnGroupName(member, scopedGroups, selectedGroup) || '—'}
                      </td>

                      <td style={styles.td}>{member.email || '—'}</td>

                      <td style={styles.td}>{getMemberPhone(member) || '—'}</td>

                      <td style={styles.td}>{getRoleLabel(member.role)}</td>

                      <td style={styles.td}>
                        <StatusBadge
                          status={requestStatus}
                          requestedRole={
                            getRequestData(latestRequest).requested_role
                          }
                        />
                      </td>

                      <td style={styles.td}>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              ...styles.button,
                              opacity: isPending ? 0.5 : 1,
                              cursor: isPending ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => handleMemberClick(member)}
                            disabled={isPending}
                          >
                            Request role
                          </button>

                          {ownGroups.length > 0 ? (
                            ownGroups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                style={{
                                  ...styles.deleteButton,
                                  opacity:
                                    deletingGroupId === String(group.id)
                                      ? 0.5
                                      : 1,
                                }}
                                onClick={() =>
                                  handleDeleteGroup(group, member)
                                }
                                disabled={
                                  deletingGroupId !== null ||
                                  loadingGroups
                                }
                                title={`Delete group: ${group.name}`}
                              >
                                {deletingGroupId === String(group.id)
                                  ? 'Deleting...'
                                  : `Delete ${group.name}`}
                              </button>
                            ))
                          ) : (
                            <span style={styles.muted}>
                              No group to delete
                            </span>
                          )}
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

      {detailMember && (
        <div
          style={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
          >
            <div style={styles.modalHeader}>
              <h2
                id="request-modal-title"
                style={{ margin: 0, fontSize: '20px' }}
              >
                Request role or create group
              </h2>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={closeModal}
                disabled={requestLoading}
              >
                Close
              </button>
            </div>

            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>
              Selected member information
            </h3>

            <div style={styles.infoPanel}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Member ID:</span>
                <span>{getMemberId(detailMember) ?? '—'}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Full name:</span>
                <span>{getMemberName(detailMember) || '—'}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Group:</span>
                <span>
                  {getOwnGroupName(
                    detailMember,
                    scopedGroups,
                    selectedGroup
                  ) || '—'}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Email:</span>
                <span>{detailMember.email || '—'}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone:</span>
                <span>{getMemberPhone(detailMember) || '—'}</span>
              </div>

              <div style={{ ...styles.infoRow, marginBottom: 0 }}>
                <span style={styles.infoLabel}>Current role:</span>
                <span>{getRoleLabel(detailMember.role)}</span>
              </div>
            </div>

            <div style={styles.field}>
              <label htmlFor="request-action" style={styles.label}>
                Request action
              </label>

              <select
                id="request-action"
                style={styles.select}
                value={requestAction}
                onChange={(event) => {
                  setRequestAction(event.target.value);
                  setRequestMessage('');
                  setRequestError('');
                }}
                disabled={requestLoading || Boolean(requestMessage)}
              >
                <option value="group_creation">
                  Create a new group and assign its leader
                </option>
                <option value="leader_assignment">
                  Change role in the existing group
                </option>
              </select>
            </div>

            {requestAction === 'group_creation' && (
              <>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
                  New group information
                </h3>

                <div style={styles.field}>
                  <label htmlFor="new-group-type" style={styles.label}>
                    New group type
                  </label>

                  <select
                    id="new-group-type"
                    style={styles.select}
                    value={newGroupType}
                    onChange={(event) => setNewGroupType(event.target.value)}
                    disabled={requestLoading || Boolean(requestMessage)}
                  >
                    {groupTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label htmlFor="new-group-name" style={styles.label}>
                    New group name *
                  </label>

                  <input
                    id="new-group-name"
                    type="text"
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    placeholder="Enter the new group name"
                    style={styles.textInput}
                    maxLength={150}
                    disabled={requestLoading || Boolean(requestMessage)}
                  />
                </div>

                <div style={styles.field}>
                  <label htmlFor="new-group-location" style={styles.label}>
                    Group location
                  </label>

                  <input
                    id="new-group-location"
                    type="text"
                    value={newGroupLocation}
                    onChange={(event) =>
                      setNewGroupLocation(event.target.value)
                    }
                    placeholder="Enter the group's meeting location"
                    style={styles.textInput}
                    maxLength={200}
                    disabled={requestLoading || Boolean(requestMessage)}
                  />
                </div>

                <div style={styles.field}>
                  <label
                    htmlFor="new-group-description"
                    style={styles.label}
                  >
                    Group description
                  </label>

                  <textarea
                    id="new-group-description"
                    value={newGroupDescription}
                    onChange={(event) =>
                      setNewGroupDescription(event.target.value)
                    }
                    placeholder="Describe the purpose of this group"
                    style={styles.textArea}
                    rows={4}
                    maxLength={2000}
                    disabled={requestLoading || Boolean(requestMessage)}
                  />
                </div>

                <p style={styles.muted}>
                  The selected member's information and requested role will
                  accompany the group information in the request.
                </p>
              </>
            )}

            <div style={styles.field}>
              <label htmlFor="member-role" style={styles.label}>
                Requested role *
              </label>

              <input
                id="member-role"
                type="text"
                value={editableRole}
                onChange={(event) => setEditableRole(event.target.value)}
                placeholder="e.g. secretary, treasurer, organizer"
                style={styles.textInput}
                maxLength={60}
                disabled={requestLoading || Boolean(requestMessage)}
              />

              <small style={styles.muted}>
                Enter a church position such as secretary, treasurer,
                organizer, assistant secretary or cell leader.
              </small>
            </div>

            {requestAction === 'leader_assignment' && (
              <p style={styles.muted}>
                This request includes the selected member's information and
                the requested role. No new group will be created.
              </p>
            )}

            {requestError && (
              <div
                style={{ ...styles.status, ...styles.error }}
                role="alert"
              >
                {requestError}
              </div>
            )}

            {requestMessage && (
              <div
                style={{ ...styles.status, ...styles.success }}
                role="status"
              >
                {requestMessage}
              </div>
            )}

            <button
              type="button"
              style={{
                ...styles.button,
                width: '100%',
                opacity:
                  requestLoading || Boolean(requestMessage) ? 0.6 : 1,
              }}
              onClick={handleSendRequest}
              disabled={requestLoading || Boolean(requestMessage)}
            >
              {requestLoading ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
