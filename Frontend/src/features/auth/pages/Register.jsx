import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { handleRegister } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await handleRegister({
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      console.error("Register failed:", error.message);
      alert(error.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#07080c] text-slate-100 px-4 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glow layer behind card */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 rounded-3xl blur-xl opacity-30" />

        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="inline-block font-semibold tracking-wide text-lg bg-gradient-to-r from-orange-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              AstraMind
            </span>
            <h2 className="text-2xl font-bold mt-3 text-slate-100">
              Create account
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Join to start chatting with AstraMind
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/40 transition-shadow"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/40 transition-shadow"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 px-4 py-2.5 pr-11 rounded-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/40 transition-shadow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-slate-500 hover:text-slate-200 bg-transparent border-none cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg shadow-lg shadow-fuchsia-500/20 transition-all"
            >
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-fuchsia-400 font-semibold hover:text-fuchsia-300 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}