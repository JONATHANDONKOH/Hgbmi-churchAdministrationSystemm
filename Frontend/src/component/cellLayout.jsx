import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function CellLayout({ navigation }) {
  return (
    <div className="dashboard dash-layout">
      <Sidebar navigation={navigation} />

      <main className="dashboard-content dash-content">
        <Outlet />
      </main>
    </div>
  );
}

export default CellLayout;