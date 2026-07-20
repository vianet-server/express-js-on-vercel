import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Briefcase, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function decodeToken(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('Token') || searchParams.get('token');
  const [payload, setPayload] = useState<{ usertype?: string; accessgroup?: number; access_group_id?: number; group_name?: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (token) setPayload(decodeToken(token));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (token) {
        const res = await fetch('/api/auth/signup-with-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Signup failed');
        login(data.token, { username: data.email || email, role: data.user_type || 'user' });
        setDone(true);
        setTimeout(() => navigate('/app/home', { replace: true }), 1000);
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Signup failed');
        navigate('/app/login', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (token && !payload) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold mt-4">Account Created!</h2>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl mt-4">
            {token ? 'Create Your Account' : 'Create App Account'}
          </CardTitle>
          <CardDescription>
            {token
              ? <>You've been invited to <strong>{payload?.group_name || 'the platform'}</strong></>
              : 'Sign up to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {token && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          {!token && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/app/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
