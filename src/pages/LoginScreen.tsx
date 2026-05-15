import { useState, useId } from 'react';
import { useAuth } from '../context/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Lock,          // brand logo
  Mail,          // email field icon
  ArrowRight,    // submit button arrow
  AlertCircle,   // error banner icon
  ShieldCheck,   // trust badges + feature item
  TrendingUp,    // feature: spending tracking
  History,       // feature: audit log
  Monitor,       // feature: multi-device
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = 'signin' | 'register';

interface FormState {
  email: string;
  password: string;
  confirm: string;
}

// ---------------------------------------------------------------------------
// COMPONENT: Field
// ---------------------------------------------------------------------------
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <Label
        htmlFor={htmlFor}
        // text-muted-foreground is a shadcn CSS variable — it automatically
        // adapts if you switch between light/dark themes later.
        className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT: InputWithIcon
// ---------------------------------------------------------------------------
function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* Icon — pointer-events-none so clicks pass through to the input */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
        {icon}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT: AuthForm  (left panel)
// ---------------------------------------------------------------------------
function AuthForm({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}) {
  const { login, register } = useAuth();

  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [form, setForm] = useState<FormState>({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isLoading, setLoading] = useState(false);

  // Generic change handler — takes the field name, returns a typed handler.
  // Clears the error on every keystroke so stale messages don't linger.
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  // Client-side validation runs before any network request.
  // Returns an error string, or '' if everything is fine.
  const validate = (): string => {
    if (!form.email.trim() || !form.password) return 'Please fill in all fields.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'register' && form.password !== form.confirm) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    onModeChange(next);
    setError('');
    setForm({ email: '', password: '', confirm: '' });
  };

  return (
    <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-11 md:flex-[0_0_52%] bg-[#0f0f0e]">

      {/* ── Brand ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[#f0ede8] font-semibold text-lg tracking-tight mb-9">
        <Lock size={18} aria-hidden="true" />
        Vault
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────── */}
      <div role="tablist" className="flex border border-white/10 rounded-lg overflow-hidden mb-7">
        {(['signin', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={[
              'flex-1 py-2 text-[13px] font-medium transition-colors',
              mode === m
                ? 'bg-[#f0ede8] text-[#0f0f0e]'           // active
                : 'text-[#a09d98] hover:text-[#f0ede8]',  // inactive
            ].join(' ')}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col">

        {/* Error banner — only mounts when there's an error. */}
        {error && (
          <div
            id="auth-error"
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 mb-4"
          >
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ── Email field ────────────────────────────────────────────── */}
        <Field label="Email" htmlFor={emailId}>
          <InputWithIcon icon={<Mail size={15} />}>
            <Input
              id={emailId}
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              aria-describedby={error ? 'auth-error' : undefined}
              className="pl-9 bg-[#0f0f0e] border-white/10 text-[#f0ede8] placeholder:text-[#6b6864] focus-visible:ring-white/20 focus-visible:border-white/25"
            />
          </InputWithIcon>
        </Field>

        {/* ── Password field ─────────────────────────────────────────── */}
        <Field label="Password" htmlFor={passwordId}>
          <InputWithIcon icon={<Lock size={15} />}>
            <Input
              id={passwordId}
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={8}
              className="pl-9 bg-[#0f0f0e] border-white/10 text-[#f0ede8] placeholder:text-[#6b6864] focus-visible:ring-white/20 focus-visible:border-white/25"
            />
          </InputWithIcon>
        </Field>

        {/* ── Confirm password — register mode only ──────────────────── */}
        {mode === 'register' && (
          <Field label="Confirm password" htmlFor={confirmId}>
            <InputWithIcon icon={<Lock size={15} />}>
              <Input
                id={confirmId}
                type="password"
                required
                placeholder="••••••••"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                minLength={8}
                className="pl-9 bg-[#0f0f0e] border-white/10 text-[#f0ede8] placeholder:text-[#6b6864] focus-visible:ring-white/20 focus-visible:border-white/25"
              />
            </InputWithIcon>
          </Field>
        )}

        {/* ── Submit button ────────────────────────────────────────────── */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1 bg-[#f0ede8] text-[#0f0f0e] hover:bg-white transition-colors"
        >
          {isLoading
            ? 'Processing…'
            : mode === 'signin' ? 'Unlock vault' : 'Initialize ledger'}
          {!isLoading && <ArrowRight size={15} className="ml-2" aria-hidden="true" />}
        </Button>

        {/* ── OAuth divider ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[12px] text-[#6b6864]">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── Google OAuth button ──────────────────────────────────────── */}
        <Button
          type="button"
          variant="outline"
          onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`; }}
          className="w-full border-white/10 text-[#a09d98] bg-transparent hover:bg-white/5 hover:text-[#f0ede8] hover:border-white/20 transition-colors"
        >
          <GoogleIcon />
          <span className="ml-2">Continue with Google</span>
        </Button>

        {/* ── Legal ─────────────────────────────────────────────────── */}
        <p className="text-[11px] text-[#6b6864] text-center mt-4 leading-relaxed">
          By continuing you agree to our{' '}
          <a href="/terms" className="text-[#a09d98] underline underline-offset-2 hover:text-[#f0ede8] transition-colors">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-[#a09d98] underline underline-offset-2 hover:text-[#f0ede8] transition-colors">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT: TrustPanel  (right panel)
// ---------------------------------------------------------------------------
function TrustPanel() {
  const features = [
    { icon: <ShieldCheck size={16} />, text: 'End-to-end encrypted at rest and in transit' },
    { icon: <TrendingUp size={16} />, text: 'Track spending across all accounts in one view' },
    { icon: <History size={16} />, text: 'Full audit log — every entry, timestamped' },
    { icon: <Monitor size={16} />, text: 'Sync across all your devices instantly' },
  ];

  const badges = ['AES-256', 'SOC 2 Type II', 'GDPR ready'];

  return (
    <div className="hidden md:flex md:flex-[0_0_48%] flex-col justify-between px-8 py-11 bg-[#1c1c1b] border-l border-white/10">

      {/* Features */}
      <div>
        <p className="text-xl font-medium text-[#f0ede8] leading-snug mb-5">
          Your financial data,<br />locked and organized.
        </p>
        <ul className="flex flex-col gap-3.5">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#a09d98] leading-relaxed">
              <span className="text-[#f0ede8] mt-0.5 shrink-0" aria-hidden="true">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
        {badges.map((b) => (
          <div key={b} className="flex items-center gap-1.5 text-[11px] text-[#6b6864]">
            <ShieldCheck size={13} aria-hidden="true" />
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE: LoginScreen
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');

  return (
    // Full-viewport dark background
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0e] px-4 py-8">
      <div className="flex flex-col md:flex-row w-full max-w-[860px] md:min-h-[560px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <AuthForm mode={mode} onModeChange={setMode} />
        <TrustPanel />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
