import '../../styles/administrationManagement.css';

export default function FellowshipManagementDashboard() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Fellowship</p>
          <h1 className="administration-title">Fellowship Dashboard</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Fellowship overview">
        <article className="administration-card">
          <p className="administration-card-label">Overview</p>
          <p className="administration-card-value">Main navigation</p>
          <p className="administration-card-detail">Use the sidebar on the left to open Members, Leaders, Meetings, Events, Attendance, Reports, and Messages.</p>
        </article>
      </section>
    </div>
  );
}
