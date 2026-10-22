import '../../styles/administrationManagement.css';

const activitiesData = [
  { title: 'Planned activities', value: '18', detail: 'Scheduled this quarter' },
  { title: 'Completed', value: '11', detail: 'Already executed' },
  { title: 'Pending', value: '07', detail: 'Awaiting approvals' },
];

export default function AdministrationActivities() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Activities</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Activities overview">
        {activitiesData.map((item) => (
          <article key={item.title} className="administration-card">
            <p className="administration-card-label">{item.title}</p>
            <p className="administration-card-value">{item.value}</p>
            <p className="administration-card-detail">{item.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
