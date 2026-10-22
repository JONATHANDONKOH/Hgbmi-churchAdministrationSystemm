import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const reportCards = [
  { title: 'Attendance Report' },
  { title: 'Event Report' },
  { title: 'Meeting Report' },
  { title: 'Financial Report' },
];

export default function GroupsReport() {
  const { groupId } = useParams();
  const location = useLocation();
  const [group, setGroup] = useState(location.state?.group || null);
  const [loading, setLoading] = useState(!location.state?.group && !!groupId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) return;
    if (location.state?.group) {
      setGroup(location.state.group);
      setLoading(false);
      setError('');
      return;
    }

    let isMounted = true;

    const fetchGroup = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
          credentials: 'include',
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Failed to load group report');
        }

        if (isMounted) {
          setGroup(data || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load group details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId, location.state]);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">
            {group?.name ? `${group.name} report` : 'Group report'}
          </h1>
          {group?.location && (
            <p className="administration-card-detail">{group.location}</p>
          )}
        </div>
      </header>

      {loading && <p className="administration-card-detail">Loading group report...</p>}
      {!loading && error && <p className="administration-card-detail">{error}</p>}

      {!loading && !error && group && (
        <div className="group-report-grid" aria-label="Group report categories">
          {reportCards.map((card) => (
            <article key={card.title} className="group-report-card">
              <div className="group-report-card-inner">{card.title}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
