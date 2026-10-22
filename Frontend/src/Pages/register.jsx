import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../Context/authContext';

/**
 * RegisterSuperAdmin
 * -------------------
 * Matches the reference image exactly:
 * - Left panel: full-bleed hero image with NO overlay filter.
 * - Right panel: clean white card with soft shadow, precise typography.
 * - Both flex panels are exactly 50% width (w-1/2) for balanced sizing.
 * - Removed "Already have an account? Sign in" link and the OR divider.
 */
export default function RegisterSuperAdmin({ onSubmit }) {
  const { registerSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await (onSubmit || registerSuperAdmin)(formData);
      navigate('/super-admin/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F9FC]">
      {/* Left: Hero image panel — full-bleed cover, NO overlay filter, exactly 50% width */}
      <div className="relative hidden md:block md:w-1/2 overflow-hidden bg-slate-900 shrink-0">
        <img
          src="/hgbmi-hero.jpg"
          alt="HGBMI — Building a Stronger Church Through Technology"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right: Registration form — exactly 50% width */}
      <div className="relative flex-1 md:w-1/2 flex items-center justify-center px-6 py-12 overflow-hidden bg-white">
        {/* Soft decorative shapes, echoing the reference background */}
        <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-[#D6ECFA] opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-24 w-40 h-40 rounded-full bg-[#EAF3FC] opacity-60 blur-2xl" />

        <div className="relative w-full max-w-[440px]">
          {/* Card styling to match the reference: rounded-2xl, soft shadow, generous padding */}
          <div className="bg-white rounded-2xl shadow-[0_10px_40px_-12px_rgba(16,42,84,0.15)] px-10 py-12">
            <h2 className="text-[#16325C] text-[32px] font-bold leading-tight tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-500 text-[14px] mt-2 leading-relaxed">
              Register a new Super Admin account for HGBMI.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Full Name Input */}
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16325C]/10 focus:border-[#16325C]/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-red-600">
                  {error}
                </p>
              )}

              {/* Primary Button - Navy Blue */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#1D4175] text-white text-[15px] font-semibold hover:bg-[#16325C] transition-colors disabled:opacity-60 shadow-md shadow-blue-900/10"
              >
                {loading ? 'Creating account…' : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="flex items-center gap-2 mt-8 justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Your information is secure and protected<br />(HTTPS &amp; Encrypted)
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