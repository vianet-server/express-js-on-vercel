import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// ---------------------------------------------------------
// 1. Fallback Loading UI (Shown while components load)
// ---------------------------------------------------------
const FullPageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <h2>Loading...</h2>
  </div>
);

// ---------------------------------------------------------
// 2. Lazy Load Layouts
// ---------------------------------------------------------
const RootLayout = lazy(() => import('./layouts/RootLayout'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const EmployLayout = lazy(() => import('./layouts/EmployLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

// ---------------------------------------------------------
// 3. Lazy Load Standard Pages (from './pages' barrel)
// ---------------------------------------------------------
const lazyPage = (name: keyof typeof import('./pages')) => 
  lazy(() => import('./pages').then((module) => ({ default: module[name] as ComponentType<any> })));

const About = lazyPage('About');
const Support = lazyPage('Support');
const PrivacyPolicy = lazyPage('PrivacyPolicy');
const TermsOfService = lazyPage('TermsOfService');
const Login = lazyPage('Login');
const Signup = lazyPage('Signup');
const AppLogin = lazyPage('AppLogin');
const Email = lazyPage('Email');
const EmployLogin = lazyPage('EmployLogin');
const EmploySignup = lazyPage('EmploySignup');
const Home = lazyPage('Home');
const Inbox = lazyPage('Inbox');
const UserProfile = lazyPage('UserProfile');
const ImportProduct = lazyPage('ImportProduct');
const NotFound = lazyPage('NotFound');
const AppStocks = lazyPage('AppStocks');
const AppDeals = lazyPage('AppDeals');
const AppInventory = lazyPage('AppInventory');
const AppSetting = lazyPage('AppSetting');
const EmployHome = lazyPage('EmployHome');
const EmployDashboard = lazyPage('EmployDashboard');
const EmployNotification = lazyPage('EmployNotification');
const EmployTallyStock = lazyPage('EmployTallyStock');
const EmployTallyLedger = lazyPage('EmployTallyLedger');
const EmployTallyVoucher = lazyPage('EmployTallyVoucher');
const EmployTallyGodown = lazyPage('EmployTallyGodown');
const EmploySocialHome = lazyPage('EmploySocialHome');
const EmploySocialAnalytics = lazyPage('EmploySocialAnalytics');
const EmploySocialUpload = lazyPage('EmploySocialUpload');
const EmploySetting = lazyPage('EmploySetting');

// ---------------------------------------------------------
// 4. Lazy Load Admin Pages (from './adminPages' barrel)
// ---------------------------------------------------------
const lazyAdminPage = (name: keyof typeof import('./adminPages')) => 
  lazy(() => import('./adminPages').then((module) => ({ default: module[name] as ComponentType<any> })));

const Dashboard = lazyAdminPage('Dashboard');
const AdminLogin = lazyAdminPage('AdminLogin');
const Analytics = lazyAdminPage('Analytics');
const Market = lazyAdminPage('Market');
const BalanceSheet = lazyAdminPage('BalanceSheet');
const Outstanding = lazyAdminPage('Outstanding');
const Pnl = lazyAdminPage('Pnl');
const Daybook = lazyAdminPage('Daybook');
const InventoryStock = lazyAdminPage('InventoryStock');
const InventoryStockDetail = lazyAdminPage('InventoryStockDetail');
const InventoryControl = lazyAdminPage('InventoryControl');
const InventorySku = lazyAdminPage('InventorySku');
const AccessGroupStocks = lazyAdminPage('AccessGroupStocks');
const Voucher = lazyAdminPage('Voucher');
const Ledger = lazyAdminPage('Ledger');
const StockItem = lazyAdminPage('StockItem');
const Masters = lazyAdminPage('Masters');
const Salesman = lazyAdminPage('Salesman');
const Profile = lazyAdminPage('Profile');
const Settings = lazyAdminPage('Settings');
const SettingsControl = lazyAdminPage('SettingsControl');
const Api = lazyAdminPage('Api');
const Sync = lazyAdminPage('Sync');
const AdminUsers = lazyAdminPage('AdminUsers');

// ---------------------------------------------------------
// 5. Router Configuration
// ---------------------------------------------------------
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Navigate to="/app/login" replace /> },
      { path: 'about', element: <About /> },
      { path: 'support', element: <Support /> },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'terms-of-service', element: <TermsOfService /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
    ],
  },
  {
    path: '/app',
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: 'login', element: <AppLogin /> },
      { path: 'signup', element: <Signup /> },
      {
        element: (
          <ProtectedRoute loginPath="/app/login" allowedRoles={['user']}>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: 'home', element: <Home /> },
          { path: 'stocks', element: <AppStocks /> },
          { path: 'deals', element: <AppDeals /> },
          { path: 'inventory', element: <AppInventory /> },
          { path: 'import-product', element: <ImportProduct /> },
          { path: 'setting', element: <AppSetting /> },
          { path: 'inbox', element: <Inbox /> },
          { path: 'user/:userId', element: <UserProfile /> },
        ],
      },
    ],
  },
  {
    path: '/employ',
    children: [
      { index: true, element: <Navigate to="/employ/home" replace /> },
      { path: 'login', element: <EmployLogin /> },
      { path: 'signup', element: <EmploySignup /> },
      {
        element: (
          <ProtectedRoute loginPath="/employ/login" allowedRoles={['employee']}>
            <EmployLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: 'home', element: <EmployHome /> },
          { path: 'dashboard', element: <EmployDashboard /> },
          { path: 'notification', element: <EmployNotification /> },
          { path: 'stock/stock', element: <EmployTallyStock /> },
          { path: 'stock/ledger', element: <EmployTallyLedger /> },
          { path: 'stock/voucher', element: <EmployTallyVoucher /> },
          { path: 'stock/godown', element: <EmployTallyGodown /> },
          { path: 'social/home', element: <EmploySocialHome /> },
          { path: 'social/analytics', element: <EmploySocialAnalytics /> },
          { path: 'social/upload', element: <EmploySocialUpload /> },
          { path: 'setting', element: <EmploySetting /> },
        ],
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute loginPath="/admin/login" allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'market', element: <Market /> },
      { path: 'email', element: <Email /> },
      { path: 'balance-sheet', element: <BalanceSheet /> },
      { path: 'outstanding', element: <Outstanding /> },
      { path: 'pnl', element: <Pnl /> },
      { path: 'daybook', element: <Daybook /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings-control', element: <SettingsControl /> },
      { path: 'api', element: <Api /> },
      { path: 'sync', element: <Sync /> },
      { path: 'inventory/stock', element: <InventoryStock /> },
      { path: 'inventory/stock/:id', element: <InventoryStockDetail /> },
      { path: 'inventory/control', element: <InventoryControl /> },
      { path: 'inventory/sku', element: <InventorySku /> },
      { path: 'inventory/access-group/:name', element: <AccessGroupStocks /> },
      { path: 'stock/voucher', element: <Voucher /> },
      { path: 'stock/ledger', element: <Ledger /> },
      { path: 'stock/stock-item', element: <StockItem /> },
      { path: 'stock/masters', element: <Masters /> },
      { path: 'stock/salesman', element: <Salesman /> },
      { path: 'users', element: <AdminUsers /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}