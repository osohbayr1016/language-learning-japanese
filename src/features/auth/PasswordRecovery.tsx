import React, { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { request } from "@src/lib/api/client";
import "../course/course.css";
export default function PasswordRecovery() {
  const reset = useLocation().pathname === "/reset-password";
  const [params, setParams] = useSearchParams();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    void request<{ data: { passwordReset: boolean } }>("/api/auth/capabilities")
      .then((r) => {
        if (alive) setAvailable(r.data.passwordReset);
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <main className="course-page">
      <section className="course-card">
        <h1>{reset ? "Шинэ нууц үг" : "Нууц үгээ сэргээх"}</h1>
        <p>Нэг удаагийн холбоос имэйлээр ирнэ. Холбоос 30 минут хүчинтэй.</p>
        {available === false && !reset ? (
          <p role="alert">
            Имэйлээр сэргээх үйлчилгээ одоогоор идэвхжээгүй. Админтай холбогдоно
            уу. Энэ төхөөрөмж дээрх хичээлээ үргэлжлүүлж болно.
          </p>
        ) : (
          <form
            className="course-settings"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || done) return;
              setError("");
              setMessage("");
              if (reset && (password.length < 8 || password !== confirm)) {
                setError("Дор хаяж 8 тэмдэгттэй ижил нууц үг оруулна уу.");
                return;
              }
              setBusy(true);
              try {
                const r = await request<{ message: string }>(
                  reset
                    ? "/api/auth/password-reset/confirm"
                    : "/api/auth/password-reset/request",
                  {
                    method: "POST",
                    body: JSON.stringify(
                      reset
                        ? { token: params.get("token"), password }
                        : { email },
                    ),
                  },
                );
                setMessage(r.message);
                setDone(true);
                if (reset) setParams({}, { replace: true });
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Хүсэлт амжилтгүй.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {reset ? (
              <>
                <label htmlFor="new-password">Шинэ нууц үг</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={256}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="confirm-password">Давтан оруулах</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </>
            ) : (
              <>
                <label htmlFor="recovery-email">Бүртгэлтэй имэйл</label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </>
            )}
            <button
              className="course-primary"
              disabled={busy || done || (!reset && available === null)}
            >
              {busy
                ? "Хүлээнэ үү…"
                : reset
                  ? "Нууц үг шинэчлэх"
                  : "Холбоос авах"}
            </button>
          </form>
        )}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <div className="course-actions">
          <Link to="/login">Нэвтрэх</Link>
          <Link to="/course">Хичээлдээ буцах</Link>
        </div>
      </section>
    </main>
  );
}
