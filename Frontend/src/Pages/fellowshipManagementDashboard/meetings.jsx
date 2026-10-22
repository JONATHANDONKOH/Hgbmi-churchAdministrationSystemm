import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialForm = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
};

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Something went wrong');
  }

  return data;
}

const formatDay = (date) => date.toLocaleDateString('en-GB', { day: '2-digit' });

const formatMonth = (date) => date.toLocaleDateString('en-GB', { month: 'short' });

const formatDate = (date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatRange = (start, end) =>
  start.toDateString() === end.toDateString()
    ? `${formatDate(start)} · ${formatTime(start)} - ${formatTime(end)}`
    : `${formatDate(start)}, ${formatTime(start)} - ${formatDate(end)}, ${formatTime(end)}`;

const getStatus = (start, end, now) => {
  if (now < start) return { key: 'upcoming', label: 'Upcoming' };
  if (now < end) return { key: 'ongoing', label: 'Ongoing' };
  return { key: 'completed', label: 'Completed' };
};

function MeetingList({ items, emptyText }) {
  if (items.length === 0) {
    return <p className="meeting-empty">{emptyText}</p>;
  }

  return (
    <ul className="meeting-list">
      {items.map((meeting) => (
        <li key={meeting.id} className="meeting-item">
          <div className="meeting-item-date" aria-hidden="true">
            <span className="meeting-item-day">{formatDay(meeting.start)}</span>
            <span className="meeting-item-month">{formatMonth(meeting.start)}</span>
          </div>

          <div className="meeting-item-body">
            <div className="meeting-item-top">
              <h3>{meeting.title}</h3>
              <span className={`meeting-badge meeting-badge-${meeting.status.key}`}>
                {meeting.status.label}
              </span>
            </div>

            <p className="meeting-item-agenda">{meeting.description}</p>

            <p className="meeting-item-meta">
              {formatRange(meeting.start, meeting.end)}
              {meeting.location ? ` · ${meeting.location}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FellowshipMeetingsPage() {
  const [formData, setFormData] = useState(initialForm);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedGroup = groups.find((group) => String(group.id) === groupId);

  // Fellowship groups for the dropdown
  useEffect(() => {
    const controller = new AbortController();

    const loadGroups = async () => {
      try {
        const data = await request('/groups?type=fellowship', {
          signal: controller.signal,
        });

        const list = Array.isArray(data) ? data : [];
        setGroups(list);
        if (list.length > 0) setGroupId(String(list[0].id));
      } catch (err) {
        if (err.name !== 'AbortError') setPageError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoadingGroups(false);
      }
    };

    loadGroups();

    return () => controller.abort();
  }, []);

  // Meetings for the selected fellowship
  useEffect(() => {
    if (!groupId) {
      setMeetings([]);
      return undefined;
    }

    const controller = new AbortController();

    setLoadingMeetings(true);
    setPageError('');

    const loadMeetings = async () => {
      try {
        const data = await request(`/meetings?groupId=${groupId}`, {
          signal: controller.signal,
        });

        setMeetings(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMeetings([]);
          setPageError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingMeetings(false);
      }
    };

    loadMeetings();

    return () => controller.abort();
  }, [groupId]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();

    const items = meetings.map((meeting) => {
      const start = new Date(meeting.start_date);
      const end = new Date(meeting.end_date);

      return { ...meeting, start, end, status: getStatus(start, end, now) };
    });

    return {
      upcoming: items.filter((m) => m.end >= now).sort((a, b) => a.start - b.start),
      past: items.filter((m) => m.end < now).sort((a, b) => b.start - a.start),
    };
  }, [meetings]);

  const totalMeetings = meetings.length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setFormError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');

    if (!groupId) {
      setFormError('Select a fellowship first.');
      return;
    }

    const { title, description, startDate, startTime, endDate, endTime, location } =
      formData;

    if (
      !title.trim() ||
      !description.trim() ||
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime
    ) {
      setFormError('Please fill in the title, agenda, and the start and end date and time.');
      return;
    }

    const startDateTime = `${startDate}T${startTime}`;
    const endDateTime = `${endDate}T${endTime}`;

    if (endDateTime <= startDateTime) {
      setFormError('The meeting must end after it starts.');
      return;
    }

    setSaving(true);

    try {
      const created = await request('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          groupId: Number(groupId),
          title: title.trim(),
          description: description.trim(),
          startDate: startDateTime,
          endDate: endDateTime,
          location: location.trim() || undefined,
        }),
      });

      setMeetings((current) => [...current, created]);
      setFormData(initialForm);
      setNotice('Meeting saved.');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Fellowship</p>
          <h1>Meetings</h1>
        </div>
        <div className="dashboard-actions">
          <SearchBar placeholder="Search meetings" />
        </div>
      </header>

      {pageError && (
        <p className="meeting-alert meeting-alert-error" role="alert">
          {pageError}
        </p>
      )}

      <section className="meeting-toolbar" aria-label="Select fellowship">
        <label className="meeting-field">
          <span>Fellowship</span>
          <select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            disabled={loadingGroups || groups.length === 0}
          >
            {groups.length === 0 && (
              <option value="">
                {loadingGroups ? 'Loading fellowships...' : 'No fellowships found'}
              </option>
            )}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="meeting-summary-grid" aria-label="Meeting summary overview">
        <article className="administration-card meeting-summary-card">
          <p className="administration-card-label">Total meetings</p>
          <p className="administration-card-value">{totalMeetings}</p>
          <p className="administration-card-detail">All meetings recorded</p>
        </article>

        <article className="administration-card meeting-summary-card">
          <p className="administration-card-label">Upcoming meetings</p>
          <p className="administration-card-value">{upcoming.length}</p>
          <p className="administration-card-detail">Meetings scheduled next</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Create meeting form">
        <div className="fellowship-member-panel-header">
          <h2>Create meeting</h2>
          <span>{selectedGroup ? selectedGroup.name : 'Schedule details'}</span>
        </div>

        {formError && (
          <p className="meeting-alert meeting-alert-error" role="alert">
            {formError}
          </p>
        )}

        {notice && (
          <p className="meeting-alert meeting-alert-success" role="status">
            {notice}
          </p>
        )}

        <form className="meeting-form" onSubmit={handleSubmit}>
          <div className="meeting-form-grid">
            <label className="meeting-field">
              <span>Meeting Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Weekly fellowship meeting"
                maxLength={200}
                required
              />
            </label>

            <label className="meeting-field meeting-field-wide">
              <span>Description / Agenda</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Share the agenda and key discussion points"
                rows="4"
                required
              />
            </label>

            <label className="meeting-field">
              <span>Start Date</span>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="meeting-field">
              <span>Start Time</span>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </label>

            <label className="meeting-field">
              <span>End Date</span>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="meeting-field">
              <span>End Time</span>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </label>

            <label className="meeting-field meeting-field-wide">
              <span>Meeting Location</span>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Main fellowship hall"
                maxLength={255}
              />
            </label>
          </div>

          <div className="meeting-actions">
            <button type="button" className="secondary-button" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="my-button" disabled={saving || !groupId}>
              {saving ? 'Saving...' : 'Save Meeting'}
            </button>
          </div>
        </form>
      </section>

      <section className="fellowship-member-panel" aria-label="Upcoming meetings">
        <div className="fellowship-member-panel-header">
          <h2>Upcoming meetings</h2>
          <span>{upcoming.length} scheduled</span>
        </div>

        {loadingMeetings ? (
          <p className="meeting-empty">Loading meetings...</p>
        ) : (
          <MeetingList items={upcoming} emptyText="No upcoming meetings yet." />
        )}
      </section>

      <section className="fellowship-member-panel" aria-label="Past meetings">
        <div className="fellowship-member-panel-header">
          <h2>Past meetings</h2>
          <span>{past.length} completed</span>
        </div>

        {loadingMeetings ? (
          <p className="meeting-empty">Loading meetings...</p>
        ) : (
          <MeetingList items={past} emptyText="No past meetings yet." />
        )}
      </section>
    </div>
  );
}