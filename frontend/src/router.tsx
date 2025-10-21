import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './screens/LandingPage';
import { AuthPage } from './screens/AuthPage';
import { DashboardPage } from './screens/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/auth',
    element: <AuthPage />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />
  }
]);
