import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
