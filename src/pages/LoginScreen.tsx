import React, { useState, useId } from 'react';
import { useAuth } from '../context/AuthContext';

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
// Sub-components
// ---------------------------------------------------------------------------

/** Left panel: the actual form */
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
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const validate = (): string => {
    if (!form.email.trim() || !form.password) return 'Please fill in all fields.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email adress';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'register' && form.password !== form.confirm) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setIsLoading(true);
    try {
      if (mode === 'register') {
        await register(form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      console.log('Submit:', mode, form.email);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    onModeChange(next);
    setError('');
    setForm({ email: '', password: '', confirm: '' });
  };

  return (
    <div style={styles.panel}>
      {/* Brand */}
      <div style={styles.brand}>
        <LockIcon />
        Vault
      </div>

      {/* Tab switcher */}
      <div style={styles.tabRow} role="tablist">
        {(['signin', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
            onClick={() => switchMode(m)}
            type="button"
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate style={styles.formBody}>
        {/* Error banner */}
        {error && (
          <div style={styles.errorBanner} role="alert" aria-live="polite">
            <AlertIcon />
            {error}
          </div>
        )}

        {/* Email */}
        <Field label="Email" htmlFor={emailId}>
          <InputWithIcon icon={<MailIcon />}>
            <input
              id={emailId}
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              aria-describedby={error ? 'auth-error' : undefined}
              style={styles.input}
            />
          </InputWithIcon>
        </Field>

        {/* Password */}
        <Field label="Password" htmlFor={passwordId}>
          <InputWithIcon icon={<LockSmallIcon />}>
            <input
              id={passwordId}
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={8}
              style={styles.input}
            />
          </InputWithIcon>
        </Field>

        {/* Confirm password — register only */}
        {mode === 'register' && (
          <Field label="Confirm password" htmlFor={confirmId}>
            <InputWithIcon icon={<LockCheckIcon />}>
              <input
                id={confirmId}
                type="password"
                required
                placeholder="••••••••"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                minLength={8}
                style={styles.input}
              />
            </InputWithIcon>
          </Field>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
        >
          {isLoading ? 'Processing…' : mode === 'signin' ? 'Unlock vault' : 'Initialize ledger'}
          {!isLoading && <ArrowRightIcon />}
        </button>

        {/* OAuth divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google OAuth */}
        <button type="button" style={styles.oauthBtn} onClick={() => console.log('Google OAuth')}>
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Legal */}
        <p style={styles.legal}>
          By continuing you agree to our{' '}
          <a href="/terms" style={styles.legalLink}>Terms</a> and{' '}
          <a href="/privacy" style={styles.legalLink}>Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}

/** Right panel: trust / feature highlights */
function TrustPanel() {
  const features = [
    { icon: <ShieldLockIcon />, text: 'End-to-end encrypted at rest and in transit' },
    { icon: <ChartIcon />, text: 'Track spending across all accounts in one view' },
    { icon: <HistoryIcon />, text: 'Full audit log — every entry, timestamped' },
    { icon: <DevicesIcon />, text: 'Sync across all your devices instantly' },
  ];

  const badges = ['AES-256', 'SOC 2 Type II', 'GDPR ready'];

  return (
    <div style={styles.sidePanel}>
      <div>
        <p style={styles.sideHeadline}>
          Your financial data,<br />locked and organized.
        </p>
        <ul style={styles.featureList}>
          {features.map((f, i) => (
            <li key={i} style={styles.featureItem}>
              <span style={styles.featureIcon}>{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>
      <div style={styles.trustRow}>
        {badges.map((b) => (
          <div key={b} style={styles.trustChip}>
            <ShieldCheckIcon />
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Labeled form field wrapper */
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
    <div style={styles.field}>
      <label htmlFor={htmlFor} style={styles.fieldLabel}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Input with an icon pinned to the left */
function InputWithIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={styles.inputWrap}>
      <span style={styles.inputIcon} aria-hidden="true">{icon}</span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <AuthForm mode={mode} onModeChange={setMode} />
        <TrustPanel />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles (swap for Tailwind / CSS modules as you prefer)
// ---------------------------------------------------------------------------
const colors = {
  bg: '#ffffff',
  bgSecondary: '#f8f8f7',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  textHint: '#9ca3af',
  border: 'rgba(0,0,0,0.12)',
  borderHover: 'rgba(0,0,0,0.25)',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#dc2626',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    padding: '1.5rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 860,
    minHeight: 560,
    borderRadius: 16,
    border: `0.5px solid ${colors.border}`,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
  },
  // --- Left panel ---
  panel: {
    flex: '0 0 52%',
    padding: '2.75rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
    marginBottom: '2.25rem',
    letterSpacing: '-0.3px',
  },
  tabRow: {
    display: 'flex',
    border: `0.5px solid ${colors.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: '1.75rem',
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: colors.textMuted,
    transition: 'background 0.15s, color 0.15s',
  },
  tabActive: {
    background: colors.text,
    color: '#ffffff',
  },
  formBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: colors.errorText,
    backgroundColor: colors.errorBg,
    border: `0.5px solid ${colors.errorBorder}`,
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: 500,
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textHint,
    display: 'flex',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '10px 12px 10px 36px',
    fontSize: 14,
    border: `0.5px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    backgroundColor: colors.bg,
    outline: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '11px 0',
    background: colors.text,
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 0,
    transition: 'opacity 0.15s',
  },
  submitBtnDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '1.1rem 0',
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textHint,
  },
  oauthBtn: {
    width: '100%',
    padding: '9px 0',
    background: 'transparent',
    border: `0.5px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: colors.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legal: {
    fontSize: 11,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: '1rem',
    lineHeight: 1.6,
  },
  legalLink: {
    color: colors.textMuted,
    textDecoration: 'underline',
  },
  // --- Right panel ---
  sidePanel: {
    flex: '0 0 48%',
    backgroundColor: colors.bgSecondary,
    borderLeft: `0.5px solid ${colors.border}`,
    padding: '2.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sideHeadline: {
    fontSize: 20,
    fontWeight: 500,
    color: colors.text,
    lineHeight: 1.4,
    marginBottom: '1.25rem',
    marginTop: 0,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  featureIcon: {
    color: colors.text,
    marginTop: 1,
    flexShrink: 0,
  },
  trustRow: {
    display: 'flex',
    gap: 16,
    paddingTop: '1.5rem',
    borderTop: `0.5px solid ${colors.border}`,
    flexWrap: 'wrap',
  },
  trustChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: colors.textHint,
  },
};

// ---------------------------------------------------------------------------
// Inline SVG icons (swap for lucide-react or heroicons as you prefer)
// ---------------------------------------------------------------------------
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const LockSmallIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const LockCheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m8 11 3 3 5-5" />
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
const ShieldLockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M10 11V9a2 2 0 1 1 4 0v2" />
  </svg>
);
const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);
const DevicesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="15" height="11" rx="2" />
    <path d="M17 12h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1" />
    <path d="M8 21h8m-4-4v4" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
