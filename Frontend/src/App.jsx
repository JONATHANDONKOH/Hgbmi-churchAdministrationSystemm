import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import RegisterSuperAdmin from './Pages/register.jsx';
import SuperAdminDashboard from './Pages/SuperAdminDashboard.jsx';
import CreateAdministrator from './Pages/adminstratorForm.jsx';
import SuperAdminLayout from './component/superAdminLayout.jsx';
import { superAdminNavigation } from './Config/navigation.js';
import { AuthProvider } from './Context/authContext.jsx';

function AdministratorFormPage() {
	const navigate = useNavigate();

	return <CreateAdministrator onCancel={() => navigate('/dashboard')} />;
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/dashboard" element={
						<SuperAdminLayout navigation={superAdminNavigation}>
							<SuperAdminDashboard />
						</SuperAdminLayout>
					} />
					<Route path="/administrator-form" element={
						<SuperAdminLayout navigation={superAdminNavigation}>
							<AdministratorFormPage />
						</SuperAdminLayout>
					} />
					<Route path="*" element={<RegisterSuperAdmin />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
