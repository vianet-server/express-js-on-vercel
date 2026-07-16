import { useState, useEffect } from 'react';
import { Loader2, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const token = searchParams.get('token');
  const [payload, setPayload] = useState<{ access_group_id?: number; group_name?: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await fetch('/api/auth/signup-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Signup failed');
      login(data.token, { username: data.email || email, role: data.usertype || 'user' });
      setDone(true);
      setTimeout(() => navigate('/app/home', { replace: true }), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold mt-4">Invalid Invitation Link</h2>
            <p className="text-sm text-muted-foreground mt-2">No invitation token found. Please use the link from your admin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payload) {
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
          <CardTitle className="text-2xl mt-4">Create Your Account</CardTitle>
          <CardDescription>
            You've been invited to <strong>{payload.group_name || 'the platform'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
