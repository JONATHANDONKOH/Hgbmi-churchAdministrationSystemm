import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../component/searchBar.jsx';

import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

function getUserId(user) {
  return user?.user_id ?? user?.id ?? user?._id;
}

function getArray(result, key) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function searchList(members, term) {
  const search = term.trim().toLowerCase();

  if (!search) return members;

  return members.filter((member) => {
    const information = [
      member.full_name,
      member.name,
      member.email,
      member.phone_number,
      member.fellowship_name,
      member.cell_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return information.includes(search);
  });
}

function isLeader(userId, assignments) {
  return assignments.some(
    (assignment) =>
      String(assignment.user_id) === String(userId) &&
      String(assignment.duty_type || '').toLowerCase() === 'leadership'
  );
}

export default function SharedMembersDandM({
  groupId,
  groupType,
  onMessage,
}) {
  const navigate = useNavigate();

  const normalizedGroupType = String(groupType || '').toLowerCase();

  const validGroupType = ['department', 'ministry'].includes(
    normalizedGroupType
  );

  const groupLabel =
    normalizedGroupType === 'ministry' ? 'Ministry' : 'Department';

  const numericGroupId = Number(groupId);

  const validGroupId =
    groupId !== undefined &&
    groupId !== null &&
    groupId !== '' &&
    Number.isSafeInteger(numericGroupId) &&
    numericGroupId > 0;

  const [currentMembers, setCurrentMembers] = useState([]);
  const [duties, setDuties] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [loadingDuties, setLoadingDuties] = useState(true);

  const [error, setError] = useState('');
  const [dutiesError, setDutiesError] = useState('');
  const [success, setSuccess] = useState('');

  // Add existing church member.
  const [addEmail, setAddEmail] = useState('');
  const [addLookupUser, setAddLookupUser] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [searchingMember, setSearchingMember] = useState(false);

  // Duty modal.
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [savingDuty, setSavingDuty] = useState(false);

  // Duty appointee lookup.
  const [dutyEmail, setDutyEmail] = useState('');
  const [dutyLookupUser, setDutyLookupUser] = useState(null);
  const [searchingDutyMember, setSearchingDutyMember] = useState(false);

  const [removingAssignmentId, setRemovingAssignmentId] = useState(null);

  const [dutyForm, setDutyForm] = useState({
    dutyName: '',
    dutyType: 'functional',
    description: '',
  });

  // =====================================================
  // API REQUEST
  // =====================================================

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error ||
          result.message ||
          `Request failed (${response.status}).`
      );
    }

    return result;
  }, []);

  // =====================================================
  // FETCH GROUP MEMBERS
  // =====================================================

  const fetchCurrentMembers = useCallback(
    async (signal) => {
      if (!validGroupId) return;

      const result = await request(
        `/api/user-groups/group/${numericGroupId}/members?includeSelf=true`,
        signal ? { signal } : {}
      );

      setCurrentMembers(getArray(result, 'members'));
    },
    [numericGroupId, validGroupId, request]
  );

  // =====================================================
  // FETCH GROUP DUTIES
  // =====================================================

  const fetchDuties = useCallback(
    async (signal) => {
      if (!validGroupId) return;

      const result = await request(
        `/api/group-duties/groups/${numericGroupId}`,
        signal ? { signal } : {}
      );

      setDuties(getArray(result, 'duties'));
    },
    [numericGroupId, validGroupId, request]
  );

  // =====================================================
  // FETCH DUTY ASSIGNMENTS
  // =====================================================

  const fetchAssignments = useCallback(
    async (signal) => {
      if (!validGroupId) return;

      const result = await request(
        `/api/group-duties/groups/${numericGroupId}/assignments`,
        signal ? { signal } : {}
      );

      setAssignments(getArray(result, 'assignments'));
    },
    [numericGroupId, validGroupId, request]
  );

  // =====================================================
  // REFRESH PAGE
  // =====================================================

  const refreshPage = useCallback(
    async (signal) => {
      if (!validGroupType || !validGroupId) {
        setError(
          !validGroupType
            ? 'Invalid group type. Expected department or ministry.'
            : `${groupLabel} group ID is missing or invalid.`
        );

        setLoading(false);
        setLoadingDuties(false);
        return;
      }

      setError('');
      setDutiesError('');

      const membersResult = await Promise.allSettled([
        fetchCurrentMembers(signal),
      ]);

      if (signal?.aborted) return;

      if (membersResult[0].status === 'rejected') {
        if (membersResult[0].reason?.name !== 'AbortError') {
          setError(
            membersResult[0].reason?.message ||
              'Unable to load group members.'
          );
        }
      }

      setLoading(false);

      const results = await Promise.allSettled([
        fetchDuties(signal),
        fetchAssignments(signal),
      ]);

      if (signal?.aborted) return;

      const failure = results.find(
        (result) =>
          result.status === 'rejected' &&
          result.reason?.name !== 'AbortError'
      );

      if (failure) {
        setDutiesError(
          failure.reason?.message || 'Unable to load group duties.'
        );
      }

      setLoadingDuties(false);
    },
    [
      validGroupType,
      validGroupId,
      groupLabel,
      fetchCurrentMembers,
      fetchDuties,
      fetchAssignments,
    ]
  );

  // =====================================================
  // INITIAL LOAD / GROUP CHANGE
  // =====================================================

  useEffect(() => {
    const controller = new AbortController();

    setCurrentMembers([]);
    setDuties([]);
    setAssignments([]);

    setError('');
    setDutiesError('');
    setSuccess('');

    setLoading(true);
    setLoadingDuties(true);

    setSearchTerm('');
    setMemberFilter('all');

    setAddEmail('');
    setAddLookupUser(null);

    setShowDutyModal(false);
    setDutyEmail('');
    setDutyLookupUser(null);

    setDutyForm({
      dutyName: '',
      dutyType: 'functional',
      description: '',
    });

    refreshPage(controller.signal);

    return () => controller.abort();
  }, [refreshPage]);

  // =====================================================
  // SEARCH MEMBERS
  // =====================================================

  const searchedCurrentMembers = useMemo(
    () => searchList(currentMembers, searchTerm),
    [currentMembers, searchTerm]
  );

  // =====================================================
  // CLASSIFY LEADERS AND REGULAR MEMBERS
  // =====================================================

  const leaderMembers = useMemo(
    () =>
      searchedCurrentMembers.filter((member) =>
        isLeader(getUserId(member), assignments)
      ),
    [searchedCurrentMembers, assignments]
  );

  const regularMembers = useMemo(
    () =>
      searchedCurrentMembers.filter(
        (member) => !isLeader(getUserId(member), assignments)
      ),
    [searchedCurrentMembers, assignments]
  );

  const filteredCurrentMembers = useMemo(() => {
    switch (memberFilter) {
      case 'leaders':
        return leaderMembers;

      case 'regular':
        return regularMembers;

      default:
        return searchedCurrentMembers;
    }
  }, [
    memberFilter,
    searchedCurrentMembers,
    leaderMembers,
    regularMembers,
  ]);

  const totalLeaders = useMemo(
    () =>
      currentMembers.filter((member) =>
        isLeader(getUserId(member), assignments)
      ).length,
    [currentMembers, assignments]
  );

  const totalRegularMembers = currentMembers.length - totalLeaders;

  // =====================================================
  // GET MEMBER DUTY ASSIGNMENTS
  // =====================================================

  const getMemberAssignments = (userId) =>
    assignments.filter(
      (assignment) =>
        String(assignment.user_id) === String(userId)
    );

  // =====================================================
  // RENDER MEMBER NAME
  // =====================================================

  const renderMemberName = (member) => {
    const name = member.full_name || member.name || 'Unknown';

    return (
      <div className="fellowship-member-meta">
        <div className="fellowship-member-avatar">
          {name.charAt(0).toUpperCase()}
        </div>

        <span className="fellowship-member-name">{name}</span>
      </div>
    );
  };

  // =====================================================
  // LOOKUP MEMBER BY EMAIL
  // GET /api/user-groups/search
  // =====================================================

  const lookupMemberByEmail = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Please enter the member email address.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    const result = await request(
      `/api/user-groups/search?email=${encodeURIComponent(
        normalizedEmail
      )}&groupId=${numericGroupId}`
    );

    if (!result.user) {
      throw new Error('No church member was found with this email.');
    }

    return result.user;
  };

  // =====================================================
  // SEARCH MEMBER TO ADD
  // =====================================================

  const handleSearchMember = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setAddLookupUser(null);

    try {
      setSearchingMember(true);

      const user = await lookupMemberByEmail(addEmail);

      const existing = currentMembers.some(
        (member) =>
          String(getUserId(member)) === String(getUserId(user))
      );

      if (existing) {
        setError('This member already belongs to this group.');
        return;
      }

      setAddLookupUser(user);
    } catch (err) {
      setError(err.message || 'Unable to find member.');
    } finally {
      setSearchingMember(false);
    }
  };

  // =====================================================
  // ADD MEMBER TO GROUP
  // POST /api/user-groups/by-email
  // =====================================================

  const handleAddMember = async () => {
    if (!addLookupUser) {
      setError('Search for a church member before adding.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setAddingMember(true);

      const result = await request('/api/user-groups/by-email', {
        method: 'POST',
        body: JSON.stringify({
          email: addEmail.trim().toLowerCase(),
          groupId: numericGroupId,
        }),
      });

      await fetchCurrentMembers();

      setAddEmail('');
      setAddLookupUser(null);

      setSuccess(
        result.message || 'Member successfully added to the group.'
      );
    } catch (err) {
      setError(err.message || 'Unable to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  // =====================================================
  // OPEN DUTY MODAL
  // =====================================================

  const openDutyModal = () => {
    setError('');
    setSuccess('');

    setDutyEmail('');
    setDutyLookupUser(null);

    setDutyForm({
      dutyName: '',
      dutyType: 'functional',
      description: '',
    });

    setShowDutyModal(true);
  };

  // =====================================================
  // CLOSE DUTY MODAL
  // =====================================================

  const closeDutyModal = () => {
    if (savingDuty) return;

    setShowDutyModal(false);

    setDutyEmail('');
    setDutyLookupUser(null);

    setDutyForm({
      dutyName: '',
      dutyType: 'functional',
      description: '',
    });
  };

  // =====================================================
  // DUTY FORM INPUT
  // =====================================================

  const handleDutyFormChange = (e) => {
    const { name, value } = e.target;

    setDutyForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SEARCH DUTY APPOINTEE
  // =====================================================

  const handleSearchDutyMember = async (e) => {
    e.preventDefault();

    setError('');
    setDutyLookupUser(null);

    try {
      setSearchingDutyMember(true);

      const user = await lookupMemberByEmail(dutyEmail);

      setDutyLookupUser(user);
    } catch (err) {
      setError(err.message || 'Unable to find member.');
    } finally {
      setSearchingDutyMember(false);
    }
  };

  // =====================================================
  // CHANGE DUTY APPOINTEE
  // =====================================================

  const handleChangeDutyMember = () => {
    setDutyLookupUser(null);
    setDutyEmail('');
    setError('');
  };

  // =====================================================
  // CREATE DUTY AND ASSIGN MEMBER
  // POST /api/group-duties/groups/:groupId/create-and-assign
  // =====================================================

  const handleCreateAndAssignDuty = async (e) => {
    e.preventDefault();

    const dutyName = dutyForm.dutyName.trim();

    if (!dutyName) {
      setError('Please enter a duty name.');
      return;
    }

    if (dutyName.length > 150) {
      setError('Duty name cannot exceed 150 characters.');
      return;
    }

    if (!['leadership', 'functional'].includes(dutyForm.dutyType)) {
      setError('Please select a valid duty type.');
      return;
    }

    if (!dutyLookupUser) {
      setError('Please search for and select an appointee.');
      return;
    }

    const userId = getUserId(dutyLookupUser);

    if (!userId || !Number.isSafeInteger(Number(userId))) {
      setError('Unable to identify the selected member.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setSavingDuty(true);

      const result = await request(
        `/api/group-duties/groups/${numericGroupId}/create-and-assign`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: dutyEmail.trim().toLowerCase(),
            userId: Number(userId),
            dutyName,
            dutyType: dutyForm.dutyType,
            description: dutyForm.description.trim(),
          }),
        }
      );

      await Promise.all([
        fetchCurrentMembers(),
        fetchDuties(),
        fetchAssignments(),
      ]);

      setShowDutyModal(false);

      setDutyEmail('');
      setDutyLookupUser(null);

      setDutyForm({
        dutyName: '',
        dutyType: 'functional',
        description: '',
      });

      setSuccess(
        result.message || 'Duty created and assigned successfully.'
      );
    } catch (err) {
      console.error('Create and assign duty error:', err);

      setError(
        err.message || 'Unable to create and assign duty.'
      );
    } finally {
      setSavingDuty(false);
    }
  };

  // =====================================================
  // REMOVE DUTY ASSIGNMENT
  // =====================================================

  const handleRemoveAssignment = async (assignment) => {
    const assignmentId = assignment.assignment_id;

    if (!assignmentId) {
      setError('Unable to identify the selected assignment.');
      return;
    }

    const confirmed = window.confirm(
      `Remove "${assignment.duty_name}" from ${
        assignment.full_name || 'this member'
      }?`
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      setRemovingAssignmentId(String(assignmentId));

      await request(
        `/api/group-duties/groups/${numericGroupId}/assignments/${assignmentId}`,
        { method: 'DELETE' }
      );

      await fetchAssignments();

      setSuccess('Duty assignment removed successfully.');
    } catch (err) {
      console.error('Remove duty error:', err);

      setError(err.message || 'Unable to remove duty.');
    } finally {
      setRemovingAssignmentId(null);
    }
  };

  // =====================================================
  // MESSAGE MEMBER
  // =====================================================

  const handleMessageMember = (member) => {
    const userId = getUserId(member);

    if (!userId) {
      setError('Unable to identify this member.');
      return;
    }

    setError('');

    if (typeof onMessage === 'function') {
      onMessage(member);
      return;
    }

    navigate(`/messages/${userId}`);
  };

  // =====================================================
  // TABLE STYLES
  // =====================================================

  const tableCellStyle = {
    padding: '13px 10px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'middle',
  };

  const emptyStyle = {
    padding: '30px 20px',
    textAlign: 'center',
    color: '#667085',
    fontSize: '14px',
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="administration-section-page">

      {/* PAGE HEADER */}

      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">{groupLabel}</p>
          <h1>Members</h1>
        </div>

        <div className="dashboard-actions">
          <SearchBar
            placeholder="Search group members..."
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
        </div>
      </header>

      {/* GENERAL ERROR */}

      {error && !showDutyModal && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            margin: '12px 0',
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* DUTIES ERROR */}

      {dutiesError && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            margin: '12px 0',
            background: '#fffbeb',
            color: '#92400e',
            fontSize: '14px',
          }}
        >
          Duties could not be loaded: {dutiesError}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          role="status"
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            margin: '12px 0',
            background: '#ecfdf5',
            color: '#065f46',
            fontSize: '14px',
          }}
        >
          {success}
        </div>
      )}

      {/* STATISTICS */}

      <section className="administration-stats">

        <article className="administration-card">
          <p className="administration-card-label">Current Members</p>

          <p className="administration-card-value">
            {loading ? 'â€”' : currentMembers.length}
          </p>

          <p className="administration-card-detail">
            Members registered in this {groupLabel.toLowerCase()}
          </p>
        </article>

        <article className="administration-card">
          <p className="administration-card-label">Leaders</p>

          <p className="administration-card-value">
            {loading || loadingDuties ? 'â€”' : totalLeaders}
          </p>

          <p className="administration-card-detail">
            Members with leadership appointments
          </p>
        </article>

        <article className="administration-card">
          <p className="administration-card-label">Regular Members</p>

          <p className="administration-card-value">
            {loading || loadingDuties ? 'â€”' : totalRegularMembers}
          </p>

          <p className="administration-card-detail">
            Members without leadership appointments
          </p>
        </article>

        <article className="administration-card">
          <p className="administration-card-label">Available Duties</p>

          <p className="administration-card-value">
            {loadingDuties ? 'â€”' : duties.length}
          </p>

          <p className="administration-card-detail">
            Duties created for this {groupLabel.toLowerCase()}
          </p>
        </article>

      </section>

      {/* EMAIL-BASED MEMBER LOOKUP */}

      <section className="fellowship-member-panel">

        <div className="fellowship-member-panel-header">
          <h2>Find Church Member</h2>
          <span>Email lookup</span>
        </div>

        <div style={{ padding: '20px 16px' }}>

          <form
            onSubmit={handleSearchMember}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 280px' }}>
              <label
                htmlFor="addMemberEmail"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#344054',
                  marginBottom: '7px',
                }}
              >
                Member Email Address
              </label>

              <input
                id="addMemberEmail"
                type="email"
                value={addEmail}
                onChange={(e) => {
                  setAddEmail(e.target.value);
                  setAddLookupUser(null);
                  setError('');
                }}
                placeholder="Enter the church member's email"
                required
                disabled={searchingMember || addingMember}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: '1px solid #d0d5dd',
                  borderRadius: '7px',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              className="my-button"
              disabled={searchingMember || addingMember}
              style={{ background: '#253b80' }}
            >
              {searchingMember ? 'Searching...' : 'Search Member'}
            </button>
          </form>

          {addLookupUser && (
            <div
              style={{
                marginTop: '18px',
                padding: '15px',
                border: '1px solid #d0d5dd',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '15px',
                background: '#f8faff',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ color: '#172033' }}>
                  {addLookupUser.full_name ||
                    addLookupUser.name ||
                    'Church Member'}
                </strong>

                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#667085',
                    fontSize: '13px',
                  }}
                >
                  {addLookupUser.email}
                </p>
              </div>

              <button
                type="button"
                className="my-button"
                disabled={addingMember}
                onClick={handleAddMember}
                style={{ background: '#253b80' }}
              >
                {addingMember ? 'Adding...' : 'Add to Group'}
              </button>
            </div>
          )}

          <p
            style={{
              margin: '12px 0 0',
              color: '#667085',
              fontSize: '12px',
            }}
          >
            Search using the email address registered to the church
            member. Only the selected member is retrieved.
          </p>

        </div>
      </section>

      {/* CURRENT GROUP MEMBERS */}

      <section
        className="fellowship-member-panel"
        style={{ marginTop: '25px' }}
      >

        <div className="fellowship-member-panel-header">

          <h2>{groupLabel} Members</h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span>
              {loading
                ? 'Loading...'
                : `${filteredCurrentMembers.length} members`}
            </span>

            <button
              type="button"
              className="my-button"
              disabled={loading || !validGroupId}
              onClick={openDutyModal}
            >
              + Create Group Duty
            </button>
          </div>

        </div>

        {/* MEMBER FILTERS */}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '15px 16px',
            borderBottom: '1px solid #eaecf0',
          }}
        >
          {[
            {
              value: 'all',
              label: 'All Members',
              count: currentMembers.length,
            },
            {
              value: 'leaders',
              label: 'Leaders',
              count: totalLeaders,
            },
            {
              value: 'regular',
              label: 'Regular Members',
              count: totalRegularMembers,
            },
          ].map((filter) => {
            const active = memberFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setMemberFilter(filter.value)}
                style={{
                  padding: '9px 15px',
                  borderRadius: '7px',
                  border: active
                    ? '1px solid #253b80'
                    : '1px solid #d0d5dd',
                  background: active ? '#253b80' : '#ffffff',
                  color: active ? '#ffffff' : '#344054',
                  fontWeight: active ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>

        {/* MEMBER TABLE */}

        <div
          className="fellowship-member-list"
          style={{ padding: '0 16px 16px' }}
        >
          {loading ? (
            <p style={emptyStyle}>Loading group members...</p>
          ) : loadingDuties ? (
            <p style={emptyStyle}>
              Loading leadership information...
            </p>
          ) : filteredCurrentMembers.length === 0 ? (
            <p style={emptyStyle}>
              {currentMembers.length === 0
                ? `No members have been added to this ${groupLabel.toLowerCase()} yet.`
                : memberFilter === 'leaders'
                  ? 'There are no leaders in this group yet.'
                  : memberFilter === 'regular'
                    ? 'There are no regular members matching your search.'
                    : 'No members match your search.'}
            </p>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '1250px',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Member',
                      'Status',
                      'Email',
                      'Phone',
                      'Fellowship',
                      'Cell',
                      'Assigned Duties',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          ...tableCellStyle,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCurrentMembers.map((member) => {
                    const userId = getUserId(member);

                    const memberAssignments =
                      getMemberAssignments(userId);

                    const memberIsLeader =
                      isLeader(userId, assignments);

                    return (
                      <tr key={userId}>

                        <td style={tableCellStyle}>
                          {renderMemberName(member)}
                        </td>

                        <td style={tableCellStyle}>
                          {memberIsLeader ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: '20px',
                                background: '#dcfce7',
                                color: '#166534',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Leader
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: '20px',
                                background: '#f2f4f7',
                                color: '#475467',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Member
                            </span>
                          )}
                        </td>

                        <td style={tableCellStyle}>
                          {member.email || 'â€”'}
                        </td>

                        <td style={tableCellStyle}>
                          {member.phone_number || 'â€”'}
                        </td>

                        <td style={tableCellStyle}>
                          {member.fellowship_name || 'Not assigned'}
                        </td>

                        <td style={tableCellStyle}>
                          {member.cell_name || 'Not assigned'}
                        </td>

                        <td style={tableCellStyle}>
                          {memberAssignments.length === 0 ? (
                            <span style={{ color: '#667085' }}>
                              No duty assigned
                            </span>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                maxWidth: '350px',
                              }}
                            >
                              {memberAssignments.map((assignment) => {
                                const isRemoving =
                                  removingAssignmentId ===
                                  String(assignment.assignment_id);

                                const isLeadership =
                                  String(assignment.duty_type)
                                    .toLowerCase() === 'leadership';

                                return (
                                  <span
                                    key={assignment.assignment_id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      background: isLeadership
                                        ? '#dcfce7'
                                        : '#eef2ff',
                                      color: isLeadership
                                        ? '#166534'
                                        : '#253b80',
                                      fontSize: '12px',
                                      opacity: isRemoving ? 0.6 : 1,
                                    }}
                                  >
                                    {assignment.duty_name}

                                    <button
                                      type="button"
                                      aria-label={`Remove ${assignment.duty_name}`}
                                      title="Remove duty"
                                      disabled={
                                        removingAssignmentId !== null
                                      }
                                      onClick={() =>
                                        handleRemoveAssignment(assignment)
                                      }
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        lineHeight: 1,
                                        padding: 0,
                                      }}
                                    >
                                      Ã—
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        <td style={tableCellStyle}>
                          <button
                            type="button"
                            onClick={() => handleMessageMember(member)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '7px',
                              padding: '9px 13px',
                              border: 'none',
                              borderRadius: '7px',
                              background: '#253b80',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span>âœ‰</span>
                            Message
                          </button>
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

      {/* CREATE DUTY AND APPOINT MEMBER POPUP */}

      {showDutyModal && (
        <div
          role="presentation"
          onClick={closeDutyModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
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
            aria-labelledby="create-duty-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '550px',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              margin: 'auto',
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '8px',
              }}
            >
              <h2
                id="create-duty-title"
                style={{
                  margin: 0,
                  fontSize: '21px',
                  color: '#172033',
                }}
              >
                Create Group Duty
              </h2>

              <button
                type="button"
                onClick={closeDutyModal}
                disabled={savingDuty}
                aria-label="Close popup"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '25px',
                  cursor: 'pointer',
                  color: '#667085',
                }}
              >
                Ã—
              </button>
            </div>

            <p
              style={{
                color: '#667085',
                fontSize: '13px',
                marginTop: 0,
                marginBottom: '22px',
              }}
            >
              Create a duty and appoint a church member to serve
              in this {groupLabel.toLowerCase()}.
            </p>

            <form onSubmit={handleCreateAndAssignDuty}>

              {/* DUTY NAME */}

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="dutyName"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '7px',
                    color: '#344054',
                  }}
                >
                  Duty Name
                </label>

                <input
                  id="dutyName"
                  name="dutyName"
                  type="text"
                  value={dutyForm.dutyName}
                  onChange={handleDutyFormChange}
                  placeholder={`e.g. ${groupLabel} Secretary`}
                  maxLength={150}
                  required
                  disabled={savingDuty}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '7px',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* DUTY TYPE */}

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="dutyType"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '7px',
                    color: '#344054',
                  }}
                >
                  Duty Type
                </label>

                <select
                  id="dutyType"
                  name="dutyType"
                  value={dutyForm.dutyType}
                  onChange={handleDutyFormChange}
                  required
                  disabled={savingDuty}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '7px',
                    background: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="leadership">Leadership</option>
                  <option value="functional">Functional</option>
                </select>
              </div>

              {/* DESCRIPTION */}

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="dutyDescription"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '7px',
                    color: '#344054',
                  }}
                >
                  Description
                </label>

                <textarea
                  id="dutyDescription"
                  name="description"
                  value={dutyForm.description}
                  onChange={handleDutyFormChange}
                  placeholder="Describe the responsibilities of this duty..."
                  rows={4}
                  maxLength={2000}
                  disabled={savingDuty}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '7px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* APPOINTEE EMAIL LOOKUP */}

              <div style={{ marginBottom: '22px' }}>
                <label
                  htmlFor="dutyMemberEmail"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '7px',
                    color: '#344054',
                  }}
                >
                  Appointee Email Address
                </label>

                {dutyLookupUser ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '12px',
                      border: '1px solid #253b80',
                      borderRadius: '8px',
                      background: '#f8faff',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          color: '#172033',
                          fontWeight: 600,
                          fontSize: '14px',
                        }}
                      >
                        {dutyLookupUser.full_name ||
                          dutyLookupUser.name ||
                          'Church Member'}
                      </p>

                      <p
                        style={{
                          margin: '4px 0 0',
                          color: '#667085',
                          fontSize: '12px',
                        }}
                      >
                        {dutyLookupUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleChangeDutyMember}
                      disabled={savingDuty}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#253b80',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        id="dutyMemberEmail"
                        type="email"
                        value={dutyEmail}
                        onChange={(e) => {
                          setDutyEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter appointee email"
                        required
                        disabled={savingDuty || searchingDutyMember}
                        style={{
                          flex: '1 1 230px',
                          minWidth: 0,
                          padding: '12px',
                          border: '1px solid #d0d5dd',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                      />

                      <button
                        type="button"
                        disabled={
                          savingDuty ||
                          searchingDutyMember ||
                          !dutyEmail.trim()
                        }
                        onClick={handleSearchDutyMember}
                        style={{
                          padding: '11px 15px',
                          border: 'none',
                          borderRadius: '7px',
                          background: '#253b80',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {searchingDutyMember
                          ? 'Searching...'
                          : 'Find Member'}
                      </button>
                    </div>

                    <p
                      style={{
                        color: '#667085',
                        fontSize: '12px',
                        marginTop: '7px',
                      }}
                    >
                      Enter the registered church email address.
                      The backend will ensure the person belongs
                      to this group when the appointment is saved.
                    </p>
                  </div>
                )}
              </div>

              {/* FORM ERROR */}

              {error && (
                <div
                  role="alert"
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: '10px 12px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    marginBottom: '15px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* FORM BUTTONS */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={closeDutyModal}
                  disabled={savingDuty}
                  style={{
                    padding: '11px 17px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '7px',
                    background: '#fff',
                    color: '#344054',
                    cursor: savingDuty ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="my-button"
                  disabled={
                    savingDuty ||
                    searchingDutyMember ||
                    !dutyLookupUser
                  }
                  style={{
                    background: '#253b80',
                    opacity: savingDuty ? 0.7 : 1,
                  }}
                >
                  {savingDuty
                    ? 'Creating and Assigning...'
                    : 'Create & Assign Duty'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
