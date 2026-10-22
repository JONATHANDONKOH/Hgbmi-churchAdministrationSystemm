import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../Context/authContext';

// Only super_admin, admin, and cell_leader are redirected by role
const roleHomeRoutes = {
  super_admin: '/super-admin/dashboard',
  admin: '/administrationManagementDashboard',
  cell_leader: '/cellManagementDashboard',
};

// Everyone else is redirected by the type of their group
// (the group they lead if there is one, otherwise their first group)
const groupHomeRoutes = {
  fellowship: '/fellowshipManagementDashboard',
  cell: '/cellManagementDashboard',
  department: '/departmentManagementDashboard',
  ministry: '/ministryManagementDashboard',
};

export default function Login({ onSubmit }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier.trim() || !formData.password) {
      setError('Email/phone and password are required');
      return;
    }

    try {
      setLoading(true);

      const user = await (onSubmit || login)(
        formData.identifier.trim(),
        formData.password,
        { rememberMe }
      );

      if (!user) {
        throw new Error(
          'Login succeeded, but user information was not returned.'
        );
      }

      // Admin, super admin, and cell leader: redirect by role
      const roleRoute = roleHomeRoutes[user.role];

      // Everyone else: redirect by group type
      // (the group they lead if there is one, otherwise their first group)
      const group =
        user.groups?.find((item) => item.is_leader) || user.groups?.[0];

      const groupRoute =
        groupHomeRoutes[String(group?.type || '').toLowerCase()];

      const destination = roleRoute || groupRoute || '/dashboard';

      console.log('Redirecting to:', destination); // temporary: delete after testing

      navigate(destination, {
        replace: true,
        state: {
          groups: user.groups || [],
        },
      });
    } catch (err) {
      setError(
        err?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F9FC]">

      {/* Left: Hero image panel */}
      <div className="relative hidden md:block md:w-1/2 overflow-hidden bg-slate-900 shrink-0">
        <img
          src="/hgbmi-hero.jpg"
          alt="HGBMI — Building a Stronger Church Through Technology"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right: Login form */}
      <div className="relative flex-1 md:w-1/2 flex items-center justify-center px-6 py-12 overflow-hidden bg-white">

        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-[#D6ECFA] opacity-50 blur-3xl" />

        <div className="pointer-events-none absolute top-40 right-24 w-40 h-40 rounded-full bg-[#EAF3FC] opacity-60 blur-2xl" />

        <div className="relative w-full max-w-[440px]">

          <div className="bg-white rounded-2xl shadow-[0_10px_40px_-12px_rgba(16,42,84,0.15)] px-10 py-12">

            <h2 className="text-[#16325C] text-[32px] font-bold leading-tight tracking-tight">
              Welcome Back
            </h2>

            <p className="text-slate-500 text-[14px] mt-2 leading-relaxed">
              Sign in to your HGBMI account to access your dashboard and resources.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Email or Phone Number */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

                <input
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Email or Phone Number"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#16325C] focus:ring-[#16325C]/30"
                  />
                  Remember me
                </label>

                <a
                  href="/forgot-password"
                  className="text-[13px] font-medium text-[#1D4175] hover:text-[#16325C]"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="text-[13px] text-red-600"
                >
                  {error}
                </p>
              )}

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#1D4175] text-white text-[15px] font-semibold hover:bg-[#16325C] transition-colors disabled:opacity-60 shadow-md shadow-blue-900/10"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>

              {/* Request an Account */}
              <a
                href="/request-account"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#EAF3FC] text-[#1D4175] text-[14px] font-medium hover:bg-[#D6ECFA] transition-colors"
              >
                <UserPlus className="w-[18px] h-[18px]" />
                Request an Account
              </a>

            </form>

            {/* Security Note */}
            <div className="flex items-center gap-2 mt-8 justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-400" />

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Your information is secure and protected
                <br />
                (HTTPS &amp; Encrypted)
              </p>
            </div>

          </div>

          {/* Footer Copyright */}
          <p className="text-center text-[11px] text-slate-400 mt-8 leading-relaxed">
            © 2025 Hour of Grace Believers Ministry International (HGBMI)
            <br />
            One Church • One Secure Identity • One Connected System
          </p>

        </div>
      </div>
    </div>
  );
}