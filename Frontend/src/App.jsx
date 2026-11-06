
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './Context/authContext.jsx';
import Login from './Pages/login.jsx';

// Super Admin
import SuperAdminDashboard from './Pages/superAdmin/superAdminDashboard.jsx';
import SuperAdminFellowships from './Pages/superAdmin/fellowships.jsx';
import SuperAdminCells from './Pages/superAdmin/cells.jsx';
import SuperAdminDepartment from './Pages/superAdmin/department.jsx';
import SuperAdminMinistries from './Pages/superAdmin/ministries.jsx';
import SuperAdminAdministrators from './Pages/superAdmin/Administrators.jsx';
import SuperAdminReports from './Pages/superAdmin/reports.jsx';
import SuperAdminMessages from './Pages/superAdmin/messages.jsx';

// Layouts
import FellowshipLayout from './component/fellowshipLayout.jsx';
import CellLayout from './component/cellLayout.jsx';
import DepartmentLayout from './component/departmentLayout.jsx';
import AdministrationManagementLayout from './component/administrationManagementLayout.jsx';

// Navigation
import {
  fellowshipNavigation,
  cellNavigation,
  departmentNavigation,
  administrationManagementNavigation,
} from './Config/navigation.js';

// Fellowship pages
import FellowshipManagementDashboard from './Pages/fellowshipManagementDashboard/fellowshipManagementDashboard.jsx';
import FellowshipMembers from './Pages/fellowshipManagementDashboard/members.jsx';
import FellowshipLeaders from './Pages/fellowshipManagementDashboard/leaders.jsx';
import FellowshipMeetings from './Pages/fellowshipManagementDashboard/meetings.jsx';
import FellowshipEvents from './Pages/fellowshipManagementDashboard/Events.jsx';
import FellowshipAttendance from './Pages/fellowshipManagementDashboard/attendance.jsx';
import FellowshipReports from './Pages/fellowshipManagementDashboard/reports.jsx';
import FellowshipMessages from './Pages/fellowshipManagementDashboard/messages.jsx';

// Cell pages
import CellDashboard from './Pages/cellManagementDashboard/cellDashboard.jsx';
import CellMeetings from './Pages/cellManagementDashboard/cellMeeting.jsx';
import CellLeaders from './Pages/cellManagementDashboard/cellLeaders.jsx';
import CellMembers from './Pages/cellManagementDashboard/cellMembers.jsx';
import CellReports from './Pages/cellManagementDashboard/cellReports.jsx';
import CellEvents from './Pages/cellManagementDashboard/cellEvent.jsx';
import CellMessages from './Pages/cellManagementDashboard/cellMessage.jsx';
import CellAttendance from './Pages/cellManagementDashboard/cellAttendance.jsx';

// Department pages
import DepartmentAttendance from './Pages/departmentManagementDashboard/attendance.jsx';
import DepartmentEvents from './Pages/departmentManagementDashboard/events.jsx';
import DepartmentMeetings from './Pages/departmentManagementDashboard/meetings.jsx';
import DepartmentMembers from './Pages/departmentManagementDashboard/members.jsx';
import DepartmentLeaders from './Pages/departmentManagementDashboard/leaders.jsx';
import DepartmentMessages from './Pages/departmentManagementDashboard/messages.jsx';
import DepartmentReports from './Pages/departmentManagementDashboard/reports.jsx';

// Administration pages
import AdministrationManagementDashboard from './Pages/administrationManagement/administrationManagementDashboard.jsx';
import AdministrationFellowship from './Pages/administrationManagement/fellowship.jsx';
import AdministrationCells from './Pages/administrationManagement/cells.jsx';
import AdministrationDepartment from './Pages/administrationManagement/department.jsx';
import AdministrationMinistries from './Pages/administrationManagement/ministries.jsx';
import AdministrationReports from './Pages/administrationManagement/reports.jsx';
import GroupsReport from './Pages/administrationManagement/groupsReport.jsx';
import AdministrationNotifications from './Pages/administrationManagement/notification.jsx';
import AdministrationRequests from './Pages/administrationManagement/request.jsx';

function DashboardPlaceholder({ title }) {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Dashboard</p>
          <h1 className="administration-title">{title}</h1>
        </div>
      </header>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Get the logged-in user's Fellowship group.
  const fellowshipGroup = user?.groups?.find(
    (group) => String(group.type || '').toLowerCase() === 'fellowship'
  );

  const fellowshipGroupId =
    fellowshipGroup?.group_id ?? fellowshipGroup?.id;

  // Get the logged-in user's Cell group.
  const cellGroup = user?.groups?.find(
    (group) => String(group.type || '').toLowerCase() === 'cell'
  );

  const cellGroupId =
    cellGroup?.group_id ?? cellGroup?.id;

  // Get the logged-in user's Department group.
  const departmentGroup = user?.groups?.find(
    (group) => String(group.type || '').toLowerCase() === 'department'
  );

  const departmentGroupId =
    departmentGroup?.group_id ?? departmentGroup?.id;

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Routes>
      {/* General */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      {/* Super Admin */}
      <Route
        path="/super-admin"
        element={<SuperAdminDashboard />}
      >
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<DashboardPlaceholder title="Super Admin Dashboard" />}
        />

        <Route
          path="fellowships"
          element={<SuperAdminFellowships />}
        />

        <Route
          path="cells"
          element={<SuperAdminCells />}
        />

        <Route
          path="departments"
          element={<SuperAdminDepartment />}
        />

        <Route
          path="ministries"
          element={<SuperAdminMinistries />}
        />

        <Route
          path="administrators"
          element={<SuperAdminAdministrators />}
        />

        <Route
          path="reports"
          element={<SuperAdminReports />}
        />

        <Route
          path="reports/group/:groupId"
          element={<GroupsReport />}
        />

        <Route
          path="messages"
          element={<SuperAdminMessages />}
        />
      </Route>

      {/* Fellowship Management */}
      <Route
        path="/fellowshipManagementDashboard"
        element={<FellowshipLayout navigation={fellowshipNavigation} />}
      >
        <Route
          index
          element={<FellowshipManagementDashboard />}
        />

        <Route
          path="members"
          element={<FellowshipMembers groupId={fellowshipGroupId} />}
        />

        <Route
          path="leaders"
          element={<FellowshipLeaders />}
        />

        <Route
          path="meetings"
          element={<FellowshipMeetings />}
        />

        <Route
          path="events"
          element={
            <FellowshipEvents
              groupId={fellowshipGroupId}
              groupName={fellowshipGroup?.name}
            />
          }
        />

        <Route
          path="attendance"
          element={<FellowshipAttendance groupId={fellowshipGroupId} />}
        />

        <Route
          path="reports"
          element={<FellowshipReports />}
        />

        <Route
          path="reports/group/:groupId"
          element={<GroupsReport />}
        />

        <Route
          path="messages"
          element={<FellowshipMessages />}
        />
      </Route>

      {/* Cell Management */}
      <Route
        path="/cellManagementDashboard"
        element={<CellLayout navigation={cellNavigation} />}
      >
        <Route
          index
          element={<CellDashboard />}
        />

        <Route
          path="meetings"
          element={<CellMeetings groupId={cellGroupId} />}
        />

        <Route
          path="leaders"
          element={<CellLeaders groupId={cellGroupId} />}
        />

        <Route
          path="members"
          element={<CellMembers groupId={cellGroupId} />}
        />

        <Route
          path="reports"
          element={<CellReports groupId={cellGroupId} />}
        />

        <Route
          path="events"
          element={
            <CellEvents
              groupId={cellGroupId}
              groupName={cellGroup?.name}
            />
          }
        />

        <Route
          path="messaging"
          element={<CellMessages groupId={cellGroupId} />}
        />

        <Route
          path="attendance"
          element={<CellAttendance groupId={cellGroupId} />}
        />
      </Route>

      {/* Department Management */}
      <Route
        path="/departmentManagementDashboard"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DashboardPlaceholder title="Department Dashboard" />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/members"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentMembers
              groupId={departmentGroupId}
              groupType="department"
            />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/leaders"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentLeaders
              groupId={departmentGroupId}
              groupType="department"
            />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/meetings"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentMeetings />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/events"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentEvents
              groupId={departmentGroupId}
              groupName={departmentGroup?.name}
            />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/reports"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentReports />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/messaging"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentMessages />
          </DepartmentLayout>
        }
      />

      <Route
        path="/departmentManagementDashboard/attendance"
        element={
          <DepartmentLayout navigation={departmentNavigation}>
            <DepartmentAttendance
              groupId={departmentGroupId}
              groupType="department"
            />
          </DepartmentLayout>
        }
      />

      {/* Administration Management */}
      <Route
        path="/administration-management"
        element={
          <AdministrationManagementLayout
            navigation={administrationManagementNavigation}
          />
        }
      >
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<AdministrationManagementDashboard />}
        />

        <Route
          path="fellowship"
          element={<AdministrationFellowship />}
        />

        <Route
          path="cells"
          element={<AdministrationCells />}
        />

        <Route
          path="department"
          element={<AdministrationDepartment />}
        />

        <Route
          path="ministries"
          element={<AdministrationMinistries />}
        />

        <Route
          path="reports"
          element={<AdministrationReports />}
        />

        <Route
          path="reports/group/:groupId"
          element={<GroupsReport />}
        />

        <Route
          path="notifications"
          element={<AdministrationNotifications />}
        />

        <Route
          path="requests"
          element={<AdministrationRequests />}
        />
      </Route>

      {/* Legacy routes */}
      <Route
        path="/administrationManagementDashboard"
        element={
          <Navigate
            to="/administration-management/dashboard"
            replace
          />
        }
      />

      <Route
        path="/administration"
        element={
          <Navigate
            to="/administration-management/dashboard"
            replace
          />
        }
      />

      <Route
        path="/ministryManagementDashboard"
        element={<DashboardPlaceholder title="Ministry Dashboard" />}
      />

      <Route
        path="/select-group"
        element={<DashboardPlaceholder title="Select Your Group" />}
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
