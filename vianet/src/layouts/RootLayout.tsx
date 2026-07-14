import { Link, Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center gap-6 border-b px-6">
        <Link to="/" className="text-lg font-bold">creator os</Link>
        <nav className="flex items-center gap-20 text-sm ml-auto">
          <Link to="/pricing" className="hover:underline">pricing</Link>
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/support" className="hover:underline">Support</Link>
          <Link to="/auth/login" className="hover:underline">Login</Link>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
