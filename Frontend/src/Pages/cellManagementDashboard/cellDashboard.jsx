import '../../styles/cellDashboard.css';

const stats = [
  { label: 'Total Members', value: 12 },
  { label: 'Meetings This Month', value: 4 },
  { label: 'Upcoming Meeting', value: 'Wed, 6:00 PM' },
];

export default function CellDashboard({ groupId }) {
  return (
    <div>
      <h1 className="dash-title">Dashboard</h1>

      <div className="dash-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dash-card">
            <p className="dash-card-label">{stat.label}</p>
            <p className="dash-card-value">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}