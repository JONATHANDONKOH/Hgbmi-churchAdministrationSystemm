import { Activity, ArrowUpRight, CalendarDays, Clock3, Users } from 'lucide-react';
import '../../styles/ui.css';
import '../../styles/Fellowship.css';

const overview = [
	{ label: 'Members', value: '184', detail: 'Across 8 active cells', icon: Users },
	{ label: 'Attendance this month', value: '86%', detail: 'Up 4 points from last month', icon: Activity },
	{ label: 'Next gathering', value: 'Oct 11', detail: 'Sunday service at 10:00 AM', icon: CalendarDays },
];

const upcomingEvents = [
	{ title: 'Cell leaders check-in', date: 'Wednesday, Oct 7', time: '7:00 PM' },
	{ title: 'Fellowship Sunday service', date: 'Sunday, Oct 11', time: '10:00 AM' },
	{ title: 'New members welcome', date: 'Saturday, Oct 17', time: '3:00 PM' },
];

const recentUpdates = [
	{ title: 'North Cell submitted its weekly attendance', detail: 'Today · Attendance' },
	{ title: 'Leaders meeting notes are available', detail: 'Yesterday · Meeting' },
	{ title: 'October service roster was updated', detail: 'Oct 1 · Announcement' },
];

function FellowshipDashboard() {
	return (
		<div>
			<header className="dashboard-header">
				<div>
					<p className="dash-eyebrow">Fellowship overview</p>
					<h1 className="dash-title">Fellowship Dashboard</h1>
					<p className="dash-empty">Here is what is happening across your fellowship.</p>
				</div>
				<p className="dash-empty">
					<CalendarDays size={17} aria-hidden="true" />
					 Sunday, October 4
				</p>
			</header>

			<section className="dash-stats" aria-label="Fellowship overview statistics">
				{overview.map(({ label, value, detail, icon: Icon }) => (
					<article className="dash-card" key={label}>
						<p className="dash-card-label"><Icon size={17} aria-hidden="true" /> {label}</p>
						<p className="dash-card-value">{value}</p>
						<p className="dash-empty">{detail}</p>
					</article>
				))}
			</section>

			<div>
				<section className="dash-section" aria-labelledby="upcoming-heading">
					<div className="dash-section-heading">
						<h2 id="upcoming-heading">Upcoming events</h2>
					</div>
					<div>
						{upcomingEvents.map((event) => (
							<p className="dash-empty" key={event.title}>
								<strong>{event.title}</strong><br />
								<Clock3 size={14} aria-hidden="true" /> {event.date} at {event.time}
							</p>
						))}
					</div>
				</section>

				<section className="dash-section" aria-labelledby="updates-heading">
					<div className="dash-section-heading">
						<h2 id="updates-heading">Recent updates <ArrowUpRight size={17} aria-hidden="true" /></h2>
					</div>
					<div>
						{recentUpdates.map((update) => (
							<p className="dash-empty" key={update.title}>
								<strong>{update.title}</strong><br />{update.detail}
							</p>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}

export default FellowshipDashboard;
