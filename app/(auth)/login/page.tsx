
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeRedirect(raw: string | null) {
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.href);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Fallback to homepage.
  }
  return "/";
}

function LoginForm() {
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (isRegister && !name.trim()) {
      setIsError(true);
      setMessage("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isRegister) {
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("redirect", redirect);

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: callbackUrl.toString(),
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = redirect;
          return;
        }

        setMessage(
          "Account created! Please check your email and verify your account before signing in."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        window.location.href = redirect;
        return;
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <h1 className="mb-1 text-2xl font-bold text-white">
        Welcome to FlopShop
      </h1>

      <p className="mb-6 text-sm text-white/60">
        {isRegister
          ? "Create your HostelHub account to place orders."
          : "Sign in to your account to order snacks and track orders."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-white/70">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        {message && (
          <div
            role="alert"
            className={`rounded-lg border p-3 text-sm ${
              isError
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-green-500/40 bg-green-500/10 text-green-300"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-sm text-white/60">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
          className="font-semibold text-yellow-400 hover:text-yellow-300"
        >
          {isRegister ? "Sign In" : "Create Account"}
        </button>
      </p>

      <p className="mt-5 text-xs text-white/40">
        Your account lets you place orders and view your order history.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
