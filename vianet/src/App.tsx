import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LazyBoundary } from './components/common/LazyBoundary';
import { PageSkeleton } from './components/common/PageSkeleton';

// ---------------------------------------------------------
// 1. Lazy Load Layouts (with page-level error boundaries)
// ---------------------------------------------------------
const RootLayout = lazy(() => import('./layouts/RootLayout'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const EmployLayout = lazy(() => import('./layouts/EmployLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

// ---------------------------------------------------------
// 2. Lazy Load Standard Pages (from './pages' barrel)
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
// 3. Lazy Load Admin Pages (from './adminPages' barrel)
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
// 4. Page-Level Wrapper: Suspense + ErrorBoundary
// ---------------------------------------------------------
function PageBoundary({ children }: { children: React.ReactNode }) {
  return (
    <LazyBoundary fallback={<PageSkeleton />}>
      {children}
    </LazyBoundary>
  );
}

// ---------------------------------------------------------
// 5. Router Configuration (Two-Tier Error Isolation)
// ---------------------------------------------------------
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <RootLayout />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Navigate to="/app/login" replace /> },
      { path: 'about', element: <PageBoundary><About /></PageBoundary> },
      { path: 'support', element: <PageBoundary><Support /></PageBoundary> },
      { path: 'privacy-policy', element: <PageBoundary><PrivacyPolicy /></PageBoundary> },
      { path: 'terms-of-service', element: <PageBoundary><TermsOfService /></PageBoundary> },
    ],
  },
  {
    path: '/auth',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <AuthLayout />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      { path: 'login', element: <PageBoundary><Login /></PageBoundary> },
      { path: 'signup', element: <PageBoundary><Signup /></PageBoundary> },
    ],
  },
  {
    path: '/app',
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: 'login', element: <PageBoundary><AppLogin /></PageBoundary> },
      { path: 'signup', element: <PageBoundary><Signup /></PageBoundary> },
      {
        element: (
          <ProtectedRoute loginPath="/app/login" allowedRoles={['user']}>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <AppLayout />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          { path: 'home', element: <PageBoundary><Home /></PageBoundary> },
          { path: 'stocks', element: <PageBoundary><AppStocks /></PageBoundary> },
          { path: 'deals', element: <PageBoundary><AppDeals /></PageBoundary> },
          { path: 'inventory', element: <PageBoundary><AppInventory /></PageBoundary> },
          { path: 'import-product', element: <PageBoundary><ImportProduct /></PageBoundary> },
          { path: 'setting', element: <PageBoundary><AppSetting /></PageBoundary> },
          { path: 'inbox', element: <PageBoundary><Inbox /></PageBoundary> },
          { path: 'user/:userId', element: <PageBoundary><UserProfile /></PageBoundary> },
        ],
      },
    ],
  },
  {
    path: '/employ',
    children: [
      { index: true, element: <Navigate to="/employ/home" replace /> },
      { path: 'login', element: <PageBoundary><EmployLogin /></PageBoundary> },
      { path: 'signup', element: <PageBoundary><EmploySignup /></PageBoundary> },
      {
        element: (
          <ProtectedRoute loginPath="/employ/login" allowedRoles={['employee']}>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <EmployLayout />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          { path: 'home', element: <PageBoundary><EmployHome /></PageBoundary> },
          { path: 'dashboard', element: <PageBoundary><EmployDashboard /></PageBoundary> },
          { path: 'notification', element: <PageBoundary><EmployNotification /></PageBoundary> },
          { path: 'stock/stock', element: <PageBoundary><EmployTallyStock /></PageBoundary> },
          { path: 'stock/ledger', element: <PageBoundary><EmployTallyLedger /></PageBoundary> },
          { path: 'stock/voucher', element: <PageBoundary><EmployTallyVoucher /></PageBoundary> },
          { path: 'stock/godown', element: <PageBoundary><EmployTallyGodown /></PageBoundary> },
          { path: 'social/home', element: <PageBoundary><EmploySocialHome /></PageBoundary> },
          { path: 'social/analytics', element: <PageBoundary><EmploySocialAnalytics /></PageBoundary> },
          { path: 'social/upload', element: <PageBoundary><EmploySocialUpload /></PageBoundary> },
          { path: 'setting', element: <PageBoundary><EmploySetting /></PageBoundary> },
        ],
      },
    ],
  },
  {
    path: '/admin/login',
    element: <PageBoundary><AdminLogin /></PageBoundary>,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute loginPath="/admin/login" allowedRoles={['admin']}>
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <AdminLayout />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <PageBoundary><Dashboard /></PageBoundary> },
      { path: 'analytics', element: <PageBoundary><Analytics /></PageBoundary> },
      { path: 'market', element: <PageBoundary><Market /></PageBoundary> },
      { path: 'email', element: <PageBoundary><Email /></PageBoundary> },
      { path: 'balance-sheet', element: <PageBoundary><BalanceSheet /></PageBoundary> },
      { path: 'outstanding', element: <PageBoundary><Outstanding /></PageBoundary> },
      { path: 'pnl', element: <PageBoundary><Pnl /></PageBoundary> },
      { path: 'daybook', element: <PageBoundary><Daybook /></PageBoundary> },
      { path: 'profile', element: <PageBoundary><Profile /></PageBoundary> },
      { path: 'settings', element: <PageBoundary><Settings /></PageBoundary> },
      { path: 'settings-control', element: <PageBoundary><SettingsControl /></PageBoundary> },
      { path: 'api', element: <PageBoundary><Api /></PageBoundary> },
      { path: 'sync', element: <PageBoundary><Sync /></PageBoundary> },
      { path: 'inventory/stock', element: <PageBoundary><InventoryStock /></PageBoundary> },
      { path: 'inventory/stock/:id', element: <PageBoundary><InventoryStockDetail /></PageBoundary> },
      { path: 'inventory/control', element: <PageBoundary><InventoryControl /></PageBoundary> },
      { path: 'inventory/sku', element: <PageBoundary><InventorySku /></PageBoundary> },
      { path: 'inventory/access-group/:name', element: <PageBoundary><AccessGroupStocks /></PageBoundary> },
      { path: 'stock/voucher', element: <PageBoundary><Voucher /></PageBoundary> },
      { path: 'stock/ledger', element: <PageBoundary><Ledger /></PageBoundary> },
      { path: 'stock/stock-item', element: <PageBoundary><StockItem /></PageBoundary> },
      { path: 'stock/masters', element: <PageBoundary><Masters /></PageBoundary> },
      { path: 'stock/salesman', element: <PageBoundary><Salesman /></PageBoundary> },
      { path: 'users', element: <PageBoundary><AdminUsers /></PageBoundary> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}