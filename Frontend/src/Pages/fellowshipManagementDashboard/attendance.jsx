import { useMemo, useState } from 'react';
import { Create } from '../../component/button';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const initialRecords = [
  {
    id: 'att-1',
    title: 'Sunday Worship Service',
    startDate: '2026-10-11',
    endDate: '2026-10-11',
    present: 118,
    absent: 9,
    totalMembers: 127,
  },
  {
    id: 'att-2',
    title: 'Prayer and Fasting Meeting',
    startDate: '2026-10-04',
    endDate: '2026-10-04',
    present: 104,
    absent: 17,
    totalMembers: 121,
  },
  {
    id: 'att-3',
    title: 'Cell Leaders Review',
    startDate: '2026-09-27',
    endDate: '2026-09-27',
    present: 92,
    absent: 14,
    totalMembers: 106,
  },
];

const emptyForm = {
  title: '',
  startDate: '',
  endDate: '',
};

export default function FellowshipAttendancePage() {
  const [records, setRecords] = useState(initialRecords);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [formData, setFormData] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const summary = useMemo(() => {
    const totalMembers = records.reduce((sum, record) => sum + record.totalMembers, 0);
    const totalPresent = records.reduce((sum, record) => sum + record.present, 0);
    const totalAbsent = records.reduce((sum, record) => sum + record.absent, 0);
    const averageAttendance = totalMembers ? Math.round((totalPresent / totalMembers) * 100) : 0;

    return {
      totalAttendance: totalPresent,
      present: totalPresent,
      absent: totalAbsent,
      average: averageAttendance,
      totalMembers,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const { startDate, endDate } = dateFilter;

    if (!startDate && !endDate) {
      return records;
    }

    return records.filter((record) => {
      const recordStart = new Date(record.startDate);
      const recordEnd = new Date(record.endDate);
      const filterStart = startDate ? new Date(startDate) : null;
      const filterEnd = endDate ? new Date(endDate) : null;

      if (filterStart && recordEnd < filterStart) {
        return false;
      }

      if (filterEnd && recordStart > filterEnd) {
        return false;
      }

      return true;
    });
  }, [dateFilter, records]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setDateFilter((current) => ({ ...current, [name]: value }));
  };

  const handleGetAttendanceByDate = (event) => {
    event.preventDefault();
    setNotice('Attendance list refreshed for the selected date range.');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCreateAttendance = (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setFormError('Please complete the attendance title, start date, and end date.');
      return;
    }

    const start = new Date(`${formData.startDate}T00:00:00`);
    const end = new Date(`${formData.endDate}T00:00:00`);

    if (end < start) {
      setFormError('End date must be later than or equal to the start date.');
      return;
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      title: formData.title.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      present: 0,
      absent: 0,
      totalMembers: 0,
    };

    setRecords((current) => [newRecord, ...current]);
    setFormData(emptyForm);
    setIsFormOpen(false);
    setNotice('Attendance created successfully.');
  };

  const closeForm = () => {
    setFormData(emptyForm);
    setFormError('');
    setIsFormOpen(false);
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Fellowship</p>
          <h1>Attendance</h1>
        </div>

        <div className="dashboard-actions">
          <button type="button" className="my-button" onClick={() => setIsFormOpen(true)}>
            Create Attendance
          </button>
        </div>
      </header>

      <section className="administration-stats" aria-label="Attendance overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total attendance</p>
          <p className="administration-card-value">{summary.totalAttendance}</p>
          <p className="administration-card-detail">Members marked present across recorded attendance</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Attendance rate</p>
          <p className="administration-card-value">{summary.average}%</p>
          <p className="administration-card-detail">Average presence across all records</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Present</p>
          <p className="administration-card-value">{summary.present}</p>
          <p className="administration-card-detail">Members present overall</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Absent</p>
          <p className="administration-card-value">{summary.absent}</p>
          <p className="administration-card-detail">Members absent overall</p>
        </article>
      </section>

      {notice ? (
        <div className="event-notice event-notice-success" role="status">
          {notice}
        </div>
      ) : null}

      <section className="fellowship-member-panel" aria-label="Attendance date filter and list">
        <div className="fellowship-member-panel-header event-panel-header">
          <h2>Attendance tracking</h2>
        </div>

        <form className="attendance-filter-form" onSubmit={handleGetAttendanceByDate}>
          <div className="attendance-date-grid">
            <label className="meeting-field">
              <span>Start date</span>
              <input
                type="date"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleFilterChange}
              />
            </label>

            <label className="meeting-field">
              <span>End date</span>
              <input
                type="date"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleFilterChange}
              />
            </label>

            <div className="attendance-search-button-wrap">
              <button type="submit" className="my-button">
                Get attendance by date
              </button>
            </div>
          </div>
        </form>

        <div className="attendance-table-wrap">
          <table className="attendance-table" aria-label="Attendance records by date">
            <thead>
              <tr>
                <th>Title</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="attendance-empty-state">
                    No attendance records match the selected date range.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.title}</td>
                    <td>{record.startDate}</td>
                    <td>{record.endDate}</td>
                    <td>{record.totalMembers || record.present + record.absent}</td>
                    <td>{record.present}</td>
                    <td>{record.absent}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen ? (
        <div className="event-modal-backdrop" onClick={closeForm}>
          <div className="event-modal" onClick={(event) => event.stopPropagation()}>
            <div className="event-modal-header">
              <div>
                <p className="dashboard-eyebrow">Create attendance</p>
                <h2>New attendance record</h2>
              </div>

              <button type="button" className="modal-close-button" onClick={closeForm} aria-label="Close attendance form">
                ×
              </button>
            </div>

            <form className="meeting-form event-form" onSubmit={handleCreateAttendance}>
              <div className="meeting-form-grid">
                <label className="meeting-field meeting-field-wide">
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Sunday worship attendance"
                  />
                </label>

                <label className="meeting-field">
                  <span>Start date</span>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                  />
                </label>

                <label className="meeting-field">
                  <span>End date</span>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              {formError ? <div className="event-form-error">{formError}</div> : null}

              <div className="meeting-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="my-button">
                  Save attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
