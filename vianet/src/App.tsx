import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import EmployLayout from './layouts/EmployLayout';
import {
  About,
  Support,
  Login,
  Signup,
  AppLogin,

  EmployLogin,
  EmploySignup,
  Home,
  Inbox,
  UserProfile,
  ImportProduct,
  NotFound,
  AppStocks,
  AppDeals,
  AppInventory,
  AppSetting,
  EmployHome,
  EmployDashboard,
  EmployNotification,
  EmployTallyStock,
  EmployTallyLedger,
  EmployTallyVoucher,
  EmployTallyGodown,
  EmploySocialHome,
  EmploySocialAnalytics,
  EmploySocialUpload,
  EmploySetting,
} from './pages';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  Dashboard,
  AdminLogin,
  Analytics,
  Market,
  BalanceSheet,
  Outstanding,
  Pnl,
  Daybook,
  InventoryStock,
  InventoryStockDetail,
  InventoryControl,
  InventorySku,
  AccessGroupStocks,
  Voucher,
  Ledger,
  StockItem,
  Masters,
  Salesman,
  Profile,
  Settings,
  SettingsControl,
  Api,
  Sync,
  AdminUsers,
} from './adminPages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Navigate to="/app/login" replace /> },
      { path: 'about', element: <About /> },
      { path: 'support', element: <Support /> },
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
  return <RouterProvider router={router} />;
}
