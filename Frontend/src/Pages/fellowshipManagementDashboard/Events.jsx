import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import { Create } from '../../component/button';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const mockEvents = [
  {
    id: 'event-1',
    title: 'Youth Revival Night',
    description: 'An uplifting evening of worship, prayer, and teaching for young adults across the fellowship.',
    startDate: '2026-10-18',
    startTime: '18:00',
    endDate: '2026-10-18',
    endTime: '21:00',
    location: 'Main Fellowship Hall',
    status: 'Upcoming',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'event-2',
    title: 'Community Outreach',
    description: 'A service project focused on visiting local families, distributing food packs, and prayer support.',
    startDate: '2026-10-22',
    startTime: '09:30',
    endDate: '2026-10-22',
    endTime: '13:00',
    location: 'Ebenezer Community Center',
    status: 'Upcoming',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'event-3',
    title: 'Women in Prayer Summit',
    description: 'A dedicated prayer gathering with testimonies, worship, and guided reflection for women in the fellowship.',
    startDate: '2026-09-28',
    startTime: '17:30',
    endDate: '2026-09-28',
    endTime: '19:30',
    location: 'Ladies Wing',
    status: 'Completed',
    image:
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'event-4',
    title: 'Leadership Strategy Session',
    description: 'A planning meeting to review cell goals, church assignments, and ministry support schedules.',
    startDate: '2026-10-05',
    startTime: '18:00',
    endDate: '2026-10-05',
    endTime: '20:00',
    location: 'Church Board Room',
    status: 'Cancelled',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  },
];

const emptyForm = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  image: '',
};

const filters = ['All', 'Upcoming', 'Completed', 'Cancelled'];

function formatDate(value) {
  if (!value) return 'Not set';

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'Not set';

  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function isEndAfterStart(startDate, startTime, endDate, endTime) {
  const start = new Date(`${startDate}T${startTime || '00:00'}`);
  const end = new Date(`${endDate}T${endTime || '00:00'}`);

  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

export default function FellowshipEventsPage() {
  const [events, setEvents] = useState(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationError, setValidationError] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch = !normalizedSearch || event.title.toLowerCase().includes(normalizedSearch);
      const matchesFilter = selectedFilter === 'All' || event.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [events, searchTerm, selectedFilter]);

  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((event) => event.status === 'Upcoming').length,
      completed: events.filter((event) => event.status === 'Completed').length,
      cancelled: events.filter((event) => event.status === 'Cancelled').length,
    }),
    [events],
  );

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode('create');
    setSelectedEventId(null);
    setFormData(emptyForm);
    setValidationError('');
  };

  const openCreateForm = () => {
    setFormMode('create');
    setSelectedEventId(null);
    setFormData(emptyForm);
    setValidationError('');
    setIsFormOpen(true);
  };

  const openEditForm = (event) => {
    setFormMode('edit');
    setSelectedEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      startTime: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime,
      location: event.location,
      image: event.image || '',
    });
    setValidationError('');
    setIsFormOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    const requiredFields = [
      'title',
      'description',
      'startDate',
      'startTime',
      'endDate',
      'endTime',
      'location',
    ];

    const hasEmptyField = requiredFields.some((field) => !String(formData[field]).trim());

    if (hasEmptyField) {
      setValidationError('Please complete all required event fields before saving.');
      return;
    }

    if (!isEndAfterStart(formData.startDate, formData.startTime, formData.endDate, formData.endTime)) {
      setValidationError('The event end date and time must be later than the start date and time.');
      return;
    }

    const normalizedPayload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      image: formData.image.trim(),
      status: selectedEventId ? events.find((item) => item.id === selectedEventId)?.status || 'Upcoming' : 'Upcoming',
    };

    if (formMode === 'edit' && selectedEventId) {
      setEvents((current) =>
        current.map((item) => (item.id === selectedEventId ? { ...item, ...normalizedPayload } : item)),
      );
      setNotice({ type: 'success', message: 'Event updated successfully.' });
    } else {
      setEvents((current) => [{
        id: `event-${Date.now()}`,
        ...normalizedPayload,
      }, ...current]);
      setNotice({ type: 'success', message: 'Event created successfully.' });
    }

    closeForm();
  };

  const handleCancelEvent = (event) => {
    const confirmed = window.confirm(`Cancel "${event.title}"? This action will update the event status.`);
    if (!confirmed) {
      return;
    }

    setEvents((current) =>
      current.map((item) => (item.id === event.id ? { ...item, status: 'Cancelled' } : item)),
    );
    setDetailsEvent(null);
    setNotice({ type: 'success', message: 'Event cancelled successfully.' });
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Fellowship</p>
          <h1>Events</h1>
        </div>

        <div className="dashboard-actions">
          <SearchBar
            placeholder="Search events by title"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Create label="Create Event" onClick={openCreateForm} />
        </div>
      </header>

      <p className="event-page-description">
        Manage fellowship events, track schedules, and keep the group informed about upcoming activities and service opportunities.
      </p>

      <section className="administration-stats" aria-label="Event overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total events</p>
          <p className="administration-card-value">{stats.total}</p>
          <p className="administration-card-detail">All events in this fellowship</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Upcoming</p>
          <p className="administration-card-value">{stats.upcoming}</p>
          <p className="administration-card-detail">Scheduled activities</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Completed</p>
          <p className="administration-card-value">{stats.completed}</p>
          <p className="administration-card-detail">Successfully executed</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Cancelled</p>
          <p className="administration-card-value">{stats.cancelled}</p>
          <p className="administration-card-detail">Not proceeding</p>
        </article>
      </section>

      {notice ? (
        <div className={`event-notice event-notice-${notice.type}`} role="status">
          {notice.message}
        </div>
      ) : null}

      <section className="fellowship-member-panel" aria-label="Event list and filters">
        <div className="fellowship-member-panel-header event-panel-header">
          <h2>Event schedule</h2>

          <div className="event-filter-bar" aria-label="Filter events by status">
            {filters.map((filterName) => (
              <button
                key={filterName}
                type="button"
                className={`event-filter ${selectedFilter === filterName ? 'event-filter-active' : ''}`}
                onClick={() => setSelectedFilter(filterName)}
              >
                {filterName}
              </button>
            ))}
          </div>
        </div>

        <div className="event-list">
          {isLoading ? (
            <div className="event-state">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="event-state event-state-empty">
              No events match your current search or filter. Try a different title or create a new event.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <article key={event.id} className="event-card">
                <div className="event-card-header">
                  <div>
                    <p className="event-card-eyebrow">{event.location}</p>
                    <h3>{event.title}</h3>
                  </div>
                  <span className={`event-status-badge event-status-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>

                <p className="event-description">{event.description}</p>

                <div className="event-meta-grid">
                  <div>
                    <span className="event-meta-label">Date</span>
                    <strong>{formatDate(event.startDate)}</strong>
                  </div>
                  <div>
                    <span className="event-meta-label">Time</span>
                    <strong>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </strong>
                  </div>
                  <div>
                    <span className="event-meta-label">Location</span>
                    <strong>{event.location}</strong>
                  </div>
                </div>

                <div className="event-actions">
                  <button type="button" className="secondary-button" onClick={() => setDetailsEvent(event)}>
                    View
                  </button>
                  <button type="button" className="secondary-button" onClick={() => openEditForm(event)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="event-cancel-button"
                    onClick={() => handleCancelEvent(event)}
                    disabled={event.status === 'Cancelled'}
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {isFormOpen ? (
        <div className="event-modal-backdrop" onClick={closeForm}>
          <div className="event-modal" onClick={(event) => event.stopPropagation()}>
            <div className="event-modal-header">
              <div>
                <p className="dashboard-eyebrow">{formMode === 'edit' ? 'Edit event' : 'Create event'}</p>
                <h2>{formMode === 'edit' ? 'Update event details' : 'Create new event'}</h2>
              </div>

              <button type="button" className="modal-close-button" onClick={closeForm} aria-label="Close form">
                ×
              </button>
            </div>

            <form className="meeting-form event-form" onSubmit={handleSubmit}>
              <div className="meeting-form-grid">
                <label className="meeting-field meeting-field-wide">
                  <span>Event Title</span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Weekly fellowship service"
                  />
                </label>

                <label className="meeting-field meeting-field-wide">
                  <span>Event Description</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows="4"
                    placeholder="Describe the purpose, theme, and expected experience of this event"
                  />
                </label>

                <label className="meeting-field">
                  <span>Start Date</span>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} />
                </label>

                <label className="meeting-field">
                  <span>Start Time</span>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleFormChange} />
                </label>

                <label className="meeting-field">
                  <span>End Date</span>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} />
                </label>

                <label className="meeting-field">
                  <span>End Time</span>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleFormChange} />
                </label>

                <label className="meeting-field meeting-field-wide">
                  <span>Event Location</span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Main Fellowship Hall"
                  />
                </label>

                <label className="meeting-field meeting-field-wide">
                  <span>Event Image URL (optional)</span>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleFormChange}
                    placeholder="https://example.com/event-image.jpg"
                  />
                </label>
              </div>

              {validationError ? <div className="event-form-error">{validationError}</div> : null}

              <div className="meeting-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="my-button">
                  {formMode === 'edit' ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailsEvent ? (
        <div className="event-modal-backdrop" onClick={() => setDetailsEvent(null)}>
          <div className="event-modal event-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="event-modal-header">
              <div>
                <p className="dashboard-eyebrow">Event details</p>
                <h2>{detailsEvent.title}</h2>
              </div>

              <button type="button" className="modal-close-button" onClick={() => setDetailsEvent(null)} aria-label="Close details">
                ×
              </button>
            </div>

            {detailsEvent.image ? (
              <img className="event-details-image" src={detailsEvent.image} alt={detailsEvent.title} />
            ) : null}

            <div className="event-details-content">
              <div className="event-detail-row">
                <span>Status</span>
                <strong className={`event-status-badge event-status-${detailsEvent.status.toLowerCase()}`}>
                  {detailsEvent.status}
                </strong>
              </div>

              <div className="event-detail-row">
                <span>Date</span>
                <strong>
                  {formatDate(detailsEvent.startDate)} - {formatDate(detailsEvent.endDate)}
                </strong>
              </div>

              <div className="event-detail-row">
                <span>Time</span>
                <strong>
                  {formatTime(detailsEvent.startTime)} - {formatTime(detailsEvent.endTime)}
                </strong>
              </div>

              <div className="event-detail-row">
                <span>Location</span>
                <strong>{detailsEvent.location}</strong>
              </div>

              <div className="event-detail-row event-detail-description">
                <span>Description</span>
                <p>{detailsEvent.description}</p>
              </div>
            </div>

            <div className="meeting-actions event-modal-actions">
              <button type="button" className="secondary-button" onClick={() => openEditForm(detailsEvent)}>
                Edit event
              </button>
              <button type="button" className="event-cancel-button" onClick={() => handleCancelEvent(detailsEvent)}>
                Cancel event
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

