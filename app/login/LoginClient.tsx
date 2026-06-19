"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Gauge, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/src/hooks/useAnalytics";

type LoginStatus = "idle" | "submitting" | "success" | "error";

export function LoginClient() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      setStatus("error");
      setMessage(error?.message ?? "Login failed");
      return;
    }

    await trackEvent("auth_success", {
      method: "password",
      provider: "supabase",
      destination: "/dashboard"
    });

    setStatus("success");
    router.replace("/dashboard");
  };

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Gauge size={20} />
          </div>
          <div>
            <p className="micro-label">IELTS Pressure Lab</p>
            <h1 id="login-title">Log in</h1>
          </div>
        </div>

        <p>Enter your Supabase account to open the protected dashboard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="student@example.com"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="primary-action" disabled={status === "submitting"}>
            <LogIn size={18} />
            <span>{status === "submitting" ? "Checking..." : "Log in"}</span>
          </button>
        </form>

        {message && <p className="backend-warning">{message}</p>}
      </section>
    </main>
  );
}
