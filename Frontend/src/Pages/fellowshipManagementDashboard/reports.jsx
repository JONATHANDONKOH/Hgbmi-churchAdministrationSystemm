import '../../styles/administrationManagement.css';

export default function FellowshipReportsPage() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Fellowship</p>
          <h1 className="administration-title">Reports</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Report overview">
        <article className="administration-card">
          <p className="administration-card-label">Monthly reports</p>
          <p className="administration-card-value">04</p>
          <p className="administration-card-detail">Reports completed for review</p>
        </article>
        <article className="administration-card">
          <p className="administration-card-label">Pending</p>
          <p className="administration-card-value">02</p>
          <p className="administration-card-detail">Reports awaiting approval</p>
        </article>
        <article className="administration-card">
          <p className="administration-card-label">Last submission</p>
          <p className="administration-card-value">This week</p>
          <p className="administration-card-detail">Latest fellowship report submitted</p>
        </article>
      </section>
    </div>
  );
}
