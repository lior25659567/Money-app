import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split("#")[0], shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <main className="login">
      <h1>הכסף שלי</h1>
      {state === "sent" ? (
        <p>שלחנו קישור כניסה ל־{email}. פתח אותו מהמכשיר הזה.</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            dir="ltr"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "שולח…" : "שלח קישור כניסה"}
          </button>
          {state === "error" && <p className="error">{error}</p>}
        </form>
      )}
    </main>
  );
}
