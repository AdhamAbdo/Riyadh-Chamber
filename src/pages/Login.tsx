import { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/auth/authService';
import type { Session } from '@/types';

interface LoginProps {
  onLogin: (s: Session) => void;
  rememberDefault: boolean;
}

export function Login({ onLogin, rememberDefault }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(rememberDefault);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const session = await login(email.trim(), password, remember);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-slate-100 via-slate-50 to-brand-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      <div className="w-full max-w-md">
        <div className="card animate-scale-in overflow-hidden">
          {/* Brand header */}
          <div className="flex flex-col items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-8 dark:border-slate-800 dark:bg-slate-800/40">
            <img src="/logo.svg" alt="شعار غرفة الرياض" className="h-16 w-16" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-brand-800 dark:text-brand-300">غرفة الرياض</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">الإدارة التنفيذية لدعم الأعمال</p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">لوحة متابعة المهام والمشاريع والاجتماعات</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 px-6 py-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder=""
                dir="ltr"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder=""
                  dir="ltr"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              تذكرني
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Dev hint 
          <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              بيانات تجريبية: admin@riyadhchamber.local / Admin@12345
            </p>
          </div>*/}
        </div>
      </div>
    </div>
  );
}
