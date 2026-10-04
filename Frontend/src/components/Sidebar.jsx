import { NavLink } from 'react-router-dom';

function Sidebar({ navigation = [] }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <nav>
        {navigation.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;