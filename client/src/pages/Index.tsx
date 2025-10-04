import { Navigate } from 'react-router-dom';
import { AuthService } from '@/lib/auth';
import Dashboard from './Dashboard';

const Index = () => {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Dashboard />;
};

export default Index;
