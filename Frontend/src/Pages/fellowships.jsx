import Sidebar from '../component/sidebar';
import SearchBar from '../component/searchBar';
import '../styles/ui.css';

function Fellowships() {
	return (
		<div className="dashboard">
			<Sidebar />
			<main className="dashboard-content">
				<header className="dashboard-header">
					<div>
						<p className="dashboard-eyebrow">Community</p>
						<h1>Fellowship Dashboard</h1>
					</div>
					<div className="dashboard-actions">
						<SearchBar />
					</div>
				</header>
				<section className="dashboard-cards" aria-label="Fellowship overview">
					<article className="card">
						<h2>Fellowship groups</h2>
						<p>Group information will appear here when fellowship records are available.</p>
					</article>
				</section>
			</main>
		</div>
	);
}

export default Fellowships;
