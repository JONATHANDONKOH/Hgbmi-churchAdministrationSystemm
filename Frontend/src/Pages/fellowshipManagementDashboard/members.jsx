import { useCallback, useEffect, useState } from 'react';

import SearchBar from '../../component/searchBar';

import { Create } from '../../component/button';

import '../../styles/administrationManagement.css';

import '../../styles/ui.css';



const API_URL = (

  import.meta.env.VITE_API_URL || 'http://localhost:5000'

).replace(/\/+$/, '');



const groupTypes = [

  { value: 'cell', label: 'Cell' },

  { value: 'fellowship', label: 'Fellowship' },

  { value: 'ministry', label: 'Ministry' },

  { value: 'department', label: 'Department' },

];



// Styles for the request modal (same design as the Fellowship Leaders page).

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

  status: {

    padding: '11px 13px',

    borderRadius: '8px',

    margin: '12px 0',

    fontSize: '14px',

  },

  error: {

    background: '#fef3f2',

    color: '#b42318',

  },

  success: {

    background: '#ecfdf3',

    color: '#027a48',

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

};



function getRoleLabel(role) {

  const normalized = String(role || '').trim();



  if (!normalized) {

    return 'Member';

  }



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



export default function FellowshipMembersPage({ groupId }) {

  // Create member state

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');



  // Request modal state (same as the leaders page)

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



  // Members list state

  const [members, setMembers] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(false);

  const [membersError, setMembersError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  // ID of the user who is currently logged in.
  const [loggedInUserId, setLoggedInUserId] = useState(null);



  const [formData, setFormData] = useState({

    full_name: '',

    email: '',

    phone: '',

    password: '',

  });



  // Fetch the currently logged-in user using the authentication cookie.

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
          throw new Error(`Unable to fetch current user (${response.status})`);
        }

        const data = await response.json();
        const user = data.user || data;
        const userId = user.id ?? user.user_id ?? user.userId ?? null;

        setLoggedInUserId(userId == null ? null : String(userId));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch current user error:', err);
        }
      }
    }

    fetchCurrentUser();

    return () => controller.abort();
  }, []);


  // Fetch members in the current fellowship.

  const fetchMembers = useCallback(async (signal) => {

    if (

      !groupId ||

      !Number.isSafeInteger(Number(groupId)) ||

      Number(groupId) <= 0

    ) {

      setMembers([]);

      setLoadingMembers(false);

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

          `Failed to fetch fellowship members (${response.status})`

        );

      }



      const data = await response.json();



      if (!Array.isArray(data)) {

        throw new Error('Invalid fellowship members response');

      }



      setMembers(data);

    } catch (err) {

      if (err.name !== 'AbortError') {

        console.error('Fetch members error:', err);

        setMembers([]);

        setMembersError(

          'Unable to load members for this fellowship.'

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



  // Hide the logged-in user, then apply the search filter.

  const isLoggedInUser = (member) => {
    const memberId = getMemberId(member);

    return (
      loggedInUserId !== null &&
      memberId !== undefined &&
      memberId !== null &&
      String(memberId) === String(loggedInUserId)
    );
  };

  const filteredMembers = members.filter((member) => {
    if (isLoggedInUser(member)) return false;

    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;

    const name = member.full_name || member.name || '';
    const email = member.email || '';
    const role = member.role || '';
    const phone = member.phone_number || member.phone || '';

    return `${name} ${email} ${role} ${phone}`
      .toLowerCase()
      .includes(search);
  });

  const totalMembers = members.filter((member) => !isLoggedInUser(member)).length;


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

    memberActions: {

      display: 'flex',

      alignItems: 'center',

      justifyContent: 'flex-end',

      gap: '10px',

      marginLeft: 'auto',

    },

  };



  // Handle Create Member form inputs.

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



  // Submit a prospective member request.

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');

    setSuccess('');



    if (

      !groupId ||

      !Number.isSafeInteger(Number(groupId)) ||

      Number(groupId) <= 0

    ) {

      setError('The fellowship group ID is missing or invalid.');

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

        'Membership request submitted for administrator approval.'

      );



      setFormData({

        full_name: '',

        email: '',

        phone: '',

        password: '',

      });



      setShowForm(false);

    } catch (err) {

      setError(err.message || 'Something went wrong.');

    } finally {

      setLoading(false);

    }

  };



  // Open the request modal for a selected member.

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



  // Submit a request for administrator approval.

  const handleSendRequest = async () => {

    if (!detailMember) {

      return;

    }



    setRequestError('');

    setRequestMessage('');



    const requestedRole = normalizeRole(editableRole);

    const targetUserId = getMemberId(detailMember);



    if (

      !groupId ||

      !Number.isSafeInteger(Number(groupId)) ||

      Number(groupId) <= 0

    ) {

      setRequestError('The fellowship group ID is missing or invalid.');

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

        setRequestError(

          'The group description cannot exceed 2000 characters.'

        );

        return;

      }

    }



    // Include the selected member's information in the request.

    // The backend should verify these details against the database.

    const memberInformation = {

      target_user_id: Number(targetUserId),

      full_name: getMemberName(detailMember),

      email: detailMember.email || '',

      phone_number: getMemberPhone(detailMember),

      current_role: detailMember.role || 'member',

      requested_role: requestedRole,

    };



    // Group creation includes group details AND member information.

    const requestData =

      requestAction === 'group_creation'

        ? {

            name: newGroupName.trim(),

            type: newGroupType,

            parent_group_id: Number(groupId),

            location: newGroupLocation.trim() || null,

            description: newGroupDescription.trim() || null,

            ...memberInformation,

          }

        : {

            ...memberInformation,

          };



    const payload = {

      request_type: requestAction,

      group_id: Number(groupId),

      request_data: requestData,

    };



    try {

      setRequestLoading(true);



      const response = await fetch(`${API_URL}/api/requests`, {

        method: 'POST',

        credentials: 'include',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify(payload),

      });



      const result = await response.json().catch(() => ({}));



      if (!response.ok) {

        throw new Error(

          result.error || 'Failed to send the request.'

        );

      }



      setRequestMessage(

        requestAction === 'group_creation'

          ? 'Group creation request, including the selected member information, submitted for administrator approval.'

          : 'Role assignment request, including the selected member information, submitted for administrator approval.'

      );

    } catch (err) {

      console.error('Submit leadership request error:', err);



      setRequestError(err.message || 'Something went wrong.');

    } finally {

      setRequestLoading(false);

    }

  };



  const closeRequestModal = () => {

    if (requestLoading) {

      return;

    }



    setDetailMember(null);

    setRequestMessage('');

    setRequestError('');

  };



  return (

    <div className="administration-section-page">

      <header className="dashboard-header">

        <div>

          <p className="dashboard-eyebrow">Fellowship</p>

          <h1>Members</h1>

        </div>



        <div className="dashboard-actions">

          <SearchBar

            placeholder="Search members"

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

        aria-label="Members summary"

      >

        <article className="administration-card fellowship-summary-card">

          <p className="administration-card-label">Total members</p>

          <p className="administration-card-value">

            {loadingMembers ? '—' : totalMembers}

          </p>

          <p className="administration-card-detail">

            Approved members in the fellowship

          </p>

        </article>

      </section>



      <section

        className="fellowship-member-panel"

        aria-label="Fellowship members list"

      >

        <div className="fellowship-member-panel-header">

          <h2>Member list</h2>

          <span>

            {loadingMembers

              ? 'Loading...'

              : `${filteredMembers.length} shown`}

          </span>

        </div>



        <div className="fellowship-member-list">

          {loadingMembers ? (

            <p style={styles.loadingText}>Loading members...</p>

          ) : membersError ? (

            <p style={styles.empty}>

              Unable to display members.

            </p>

          ) : filteredMembers.length === 0 ? (

            <p style={styles.empty}>

              {members.length === 0

                ? 'No members to display.'

                : 'No members match your search.'}

            </p>

          ) : (

            filteredMembers.map((member) => {

              const name =

                member.full_name || member.name || 'Unknown';



              const role = member.role || 'member';

              const cell = member.cell || member.team || '—';

              const status = member.status || 'Active';

              const memberKey = member.id ?? member._id;



              return (

                <div

                  key={memberKey}

                  className="fellowship-member-row"

                >

                  <div className="fellowship-member-meta">

                    <div className="fellowship-member-avatar">

                      {name.charAt(0).toUpperCase()}

                    </div>



                    <div>

                      <p className="fellowship-member-name">

                        {name}

                      </p>

                      <span className="fellowship-member-role">

                        {role}

                      </span>

                    </div>

                  </div>



                  <div className="fellowship-member-cell">

                    {cell}

                  </div>



                  <span

                    className={`fellowship-member-status ${

                      status === 'Present' || status === 'Active'

                        ? 'status-present'

                        : 'status-absent'

                    }`}

                  >

                    {status}

                  </span>



                  <div style={styles.memberActions}>

                    <button

                      type="button"

                      style={requestStyles.button}

                      onClick={() => handleMemberClick(member)}

                    >

                      Request role

                    </button>

                  </div>

                </div>

              );

            })

          )}

        </div>

      </section>



      {/* CREATE MEMBER MODAL */}

      {showForm && (

        <div

          style={styles.backdrop}

          onMouseDown={(e) => {

            if (e.target === e.currentTarget) closeForm();

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

                <p style={styles.eyebrow}>Fellowship</p>

                <h2 id="create-member-title" style={styles.title}>

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

                <label htmlFor="full_name" style={styles.label}>

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

                <label htmlFor="email" style={styles.label}>

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

                <label htmlFor="phone" style={styles.label}>

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

                <label htmlFor="password" style={styles.label}>

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

                  {loading ? 'Submitting...' : 'Submit Request'}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}



      {/* REQUEST MODAL (same as Fellowship Leaders page) */}

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

                style={{ margin: 0, fontSize: '20px' }}

              >

                Request role or create group

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



            {/* Selected member information */}

            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>

              Selected member information

            </h3>



            <div style={requestStyles.infoPanel}>

              <div style={requestStyles.infoRow}>

                <span style={requestStyles.infoLabel}>Member ID:</span>

                <span>{getMemberId(detailMember) ?? '—'}</span>

              </div>



              <div style={requestStyles.infoRow}>

                <span style={requestStyles.infoLabel}>Full name:</span>

                <span>{getMemberName(detailMember) || '—'}</span>

              </div>



              <div style={requestStyles.infoRow}>

                <span style={requestStyles.infoLabel}>Email:</span>

                <span>{detailMember.email || '—'}</span>

              </div>



              <div style={requestStyles.infoRow}>

                <span style={requestStyles.infoLabel}>Phone:</span>

                <span>{getMemberPhone(detailMember) || '—'}</span>

              </div>



              <div style={{ ...requestStyles.infoRow, marginBottom: 0 }}>

                <span style={requestStyles.infoLabel}>Current role:</span>

                <span>{getRoleLabel(detailMember.role)}</span>

              </div>

            </div>



            <div style={requestStyles.field}>

              <label htmlFor="request-action" style={requestStyles.label}>

                Request action

              </label>



              <select

                id="request-action"

                style={requestStyles.select}

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



            {/* Group information */}

            {requestAction === 'group_creation' && (

              <>

                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>

                  New group information

                </h3>



                <div style={requestStyles.field}>

                  <label

                    htmlFor="new-group-type"

                    style={requestStyles.label}

                  >

                    New group type

                  </label>



                  <select

                    id="new-group-type"

                    style={requestStyles.select}

                    value={newGroupType}

                    onChange={(event) =>

                      setNewGroupType(event.target.value)

                    }

                    disabled={requestLoading || Boolean(requestMessage)}

                  >

                    {groupTypes.map((type) => (

                      <option key={type.value} value={type.value}>

                        {type.label}

                      </option>

                    ))}

                  </select>

                </div>



                <div style={requestStyles.field}>

                  <label

                    htmlFor="new-group-name"

                    style={requestStyles.label}

                  >

                    New group name *

                  </label>



                  <input

                    id="new-group-name"

                    type="text"

                    value={newGroupName}

                    onChange={(event) =>

                      setNewGroupName(event.target.value)

                    }

                    placeholder="Enter the new group name"

                    style={requestStyles.textInput}

                    maxLength={150}

                    disabled={requestLoading || Boolean(requestMessage)}

                  />

                </div>



                <div style={requestStyles.field}>

                  <label

                    htmlFor="new-group-location"

                    style={requestStyles.label}

                  >

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

                    style={requestStyles.textInput}

                    maxLength={200}

                    disabled={requestLoading || Boolean(requestMessage)}

                  />

                </div>



                <div style={requestStyles.field}>

                  <label

                    htmlFor="new-group-description"

                    style={requestStyles.label}

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

                    style={requestStyles.textArea}

                    rows={4}

                    maxLength={2000}

                    disabled={requestLoading || Boolean(requestMessage)}

                  />

                </div>



                <p style={requestStyles.muted}>

                  The selected member's ID, name, email, phone number,

                  current role and requested role will accompany the

                  group information in the request.

                </p>

              </>

            )}



            {/* Requested role */}

            <div style={requestStyles.field}>

              <label htmlFor="member-role" style={requestStyles.label}>

                Requested role *

              </label>



              <input

                id="member-role"

                type="text"

                value={editableRole}

                onChange={(event) =>

                  setEditableRole(event.target.value)

                }

                placeholder="e.g. secretary, treasurer, organizer"

                style={requestStyles.textInput}

                maxLength={60}

                disabled={requestLoading || Boolean(requestMessage)}

              />



              <small style={requestStyles.muted}>

                Enter a church position such as secretary, treasurer,

                organizer, assistant secretary or cell leader. Use

                underscores between words if needed.

              </small>

            </div>



            {requestAction === 'leader_assignment' && (

              <p style={requestStyles.muted}>

                This request includes the selected member's information

                and the requested role. No new group will be created.

              </p>

            )}



            {requestError && (

              <div

                style={{ ...requestStyles.status, ...requestStyles.error }}

                role="alert"

              >

                {requestError}

              </div>

            )}



            {requestMessage && (

              <div

                style={{ ...requestStyles.status, ...requestStyles.success }}

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