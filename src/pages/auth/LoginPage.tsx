import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { BrandLogo } from "../../components/brand/BrandLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";


import { login, loginWithGoogle } from "../../api/auth.api";
import type { LoginRequest } from "../../types/auth.types";
import type { LoginResult } from "../../api/auth.api";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            }
          ) => void;
        };
      };
    };
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const storeTokensAndRedirect = useCallback(
    (result: LoginResult) => {
      localStorage.setItem("access_token", result.accessToken);
      localStorage.setItem("refresh_token", result.refreshToken);
      localStorage.setItem("role", result.role);
      localStorage.setItem("member_id", result.memberId.toString());
      toast.success("Welcome back!", {
        description: "You have signed in successfully.",
      });
      navigate("/dashboard");
    },
    [navigate]
  );

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setError(null);
      setGoogleLoading(true);
      try {
        const result = await loginWithGoogle(response.credential);
        storeTokensAndRedirect(result);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Google sign-in failed. Please try again."
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [storeTokensAndRedirect]
  );

  // Load Google Identity Services script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // If already loaded
    if (window.google?.accounts) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup only if we added it
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Google button once ready
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleReady || !clientId || !window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
    });

    if (googleBtnRef.current) {
      // Render the hidden native button (we use our own styled button)
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "signin_with",
        shape: "rectangular",
      });
    }
  }, [googleReady, handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Please enter your email address";
    if (!password) errors.password = "Please enter your password";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setError(null);
    setLoading(true);

    const payload: LoginRequest = { email, password };

    try {
      const res: LoginResult = await login(payload);
      storeTokensAndRedirect(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // Click the hidden Google button to trigger the native popup
    const iframe = googleBtnRef.current?.querySelector("iframe");
    const innerBtn =
      googleBtnRef.current?.querySelector('[role="button"]') as HTMLElement | null;

    if (innerBtn) {
      innerBtn.click();
    } else if (iframe) {
      // Fallback: the native button may render as an iframe
      iframe.click();
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Decorative left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 relative">
        {/* Abstract decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rotate-45 rounded-3xl bg-white/[0.03]" />
        </div>

        <div className="relative z-10 max-w-md px-12 text-center">
          {/* Brand logo */}
          <BrandLogo variant="light" className="mx-auto mb-8 h-16" />
          <p className="text-base leading-relaxed text-white/70">
            Manage your academy, track student progress, and streamline
            operations — all from one powerful dashboard.
          </p>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandLogo />
          </div>

          {/* Header */}
          <div className="mb-10">
            <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-brand-400">
              Admin Portal
            </p>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-grayScale-600">
              Welcome back
            </h1>
            <p className="text-sm leading-relaxed text-grayScale-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          {googleClientId && (
            <>
              {/* Hidden native Google button */}
              <div
                ref={googleBtnRef}
                className="absolute h-0 w-0 overflow-hidden opacity-0"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || !googleReady}
                className="group mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-grayScale-200 bg-white px-4 py-3 text-sm font-medium text-grayScale-600 transition-all duration-200 hover:border-grayScale-300 hover:bg-grayScale-100 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <svg
                    className="h-5 w-5 animate-spin text-grayScale-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <GoogleIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                )}
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-grayScale-200" />
                </div>
                <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
                  <span className="bg-white px-4 text-grayScale-400">
                    or sign in with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on" method="post" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-grayScale-600"
              >
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`h-11 rounded-xl ${fieldErrors.email ? "border-red-400 focus-visible:ring-red-400/40" : ""}`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-grayScale-600"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`h-11 rounded-xl pr-10 ${fieldErrors.password ? "border-red-400 focus-visible:ring-red-400/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 transition-colors hover:text-grayScale-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl text-sm font-semibold tracking-wide"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-grayScale-400">
            <p>© {new Date().getFullYear()} Yimaru Academy · All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Version badge */}
      <p className="fixed bottom-3 right-4 font-mono text-[10px] text-grayScale-300">
        v{__BUILD_HASH__} · {new Date(__BUILD_TIME__).toLocaleDateString()}
      </p>
    </div>
  );
}

