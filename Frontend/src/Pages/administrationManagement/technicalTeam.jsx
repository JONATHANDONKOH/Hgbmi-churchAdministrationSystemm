import '../../styles/administrationManagement.css';

const technicalData = [
  { title: 'Technical team', value: '11', detail: 'On the operating roster' },
  { title: 'Service setups', value: '06', detail: 'This month planned' },
  { title: 'System uptime', value: '99.2%', detail: 'Reliable support coverage' },
];

export default function AdministrationTechnicalTeam() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Technical Team</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Technical team overview">
        {technicalData.map((item) => (
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
