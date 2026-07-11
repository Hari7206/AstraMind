import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import "../style/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await handleLogin({
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 overflow-hidden">
      {/* Subtle ambient glow - restrained, top-centered only */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[20rem] rounded-full bg-orange-600/10 blur-[100px] ambient-glow" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Outer faint border frame */}
        <div className="rounded-[2rem] border border-white/5 p-1.5 card-wrapper">
          <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[1.75rem] shadow-2xl overflow-hidden card-container">
            {/* Top glow accent inside the card */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full bg-orange-500/20 blur-[80px]" />

            {/* Animated glass shine sweep - fixed version */}
            <div className="shine-overlay"></div>

            <div className="relative p-8 z-10">
              <div className="text-center mb-8">
                <span className="inline-block text-xs font-medium tracking-[0.2em] uppercase">
                  ASTRA<span className="text-orange-400">MIND</span>
                </span>
                <h2 className="text-2xl font-semibold mt-3 text-white">
                  Welcome back
                </h2>
                <p className="text-sm text-white/40 mt-1">
                  Sign in to your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Email
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center input-wrapper password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="input-field password-input"
                      required
                    />

                    {/* Show/hide password toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="password-toggle"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                    </button>
                  </div>

                  <div className="text-right mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-white/40 hover:text-orange-400 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="signin-btn"
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-6">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="text-orange-400 font-semibold hover:text-orange-300 hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}