import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home/page'));
const AdminLogin = lazy(() => import('../pages/admin/page'));
const AdminSignup = lazy(() => import('../pages/admin/signup'));
const AdminDashboard = lazy(() => import('../pages/admin/dashboard/page'));
const AdminMobileDashboard = lazy(() => import('../pages/admin/mobile/page'));
const AdminMobileManage = lazy(() => import('../pages/admin/mobile/manage/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin',
    element: <AdminLogin />,
  },
  {
    path: '/admin/signup',
    element: <AdminSignup />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/mobile',
    element: <AdminMobileDashboard />,
  },
  {
    path: '/admin/mobile/manage',
    element: <AdminMobileManage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
