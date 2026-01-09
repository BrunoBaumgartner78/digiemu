// src/app/(auth)/forgot-password/page.tsx
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const sent = sp.sent === "1";

  return (
    <main
      style={{
        minHeight: "calc(100vh - 84px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
      }}
    >
      {/* CSS ohne Client-Handler */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .neoBtnPrimary {
              margin-top: 14px;
              width: 100%;
              border-radius: 999px;
              padding: 12px 16px;
              font-size: 15px;
              font-weight: 800;
              cursor: pointer;
              border: 1px solid rgba(148,163,184,0.45);
              background: radial-gradient(120% 160% at 0% 0%, rgba(255,255,255,0.5), transparent 55%), var(--accent, #4a7cff);
              color: #f9fafb;
              box-shadow: 0 14px 28px rgba(37,99,235,0.45), -4px -4px 12px rgba(255,255,255,0.85);
              transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
            }
            .neoBtnPrimary:hover { transform: translateY(-1px); filter: brightness(1.02); }
            .neoBtnPrimary:active {
              transform: translateY(0px);
              box-shadow: inset 6px 6px 14px rgba(15,23,42,0.18), inset -6px -6px 14px rgba(255,255,255,0.9);
              filter: brightness(1.0);
            }

            .neoBtnSoft {
              flex: 1 1 140px;
              text-align: center;
              border-radius: 999px;
              padding: 10px 14px;
              text-decoration: none;
              font-weight: 700;
              background: var(--bg-soft, #eef3fb);
              border: 1px solid rgba(15,23,42,0.08);
              box-shadow: 4px 4px 10px var(--shadow-dark, rgba(163,177,198,0.85)), -4px -4px 10px var(--shadow-light, rgba(255,255,255,0.95));
              transition: transform 120ms ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .neoBtnSoft:hover { transform: translateY(-1px); }
            .neoBtnSoft:active { transform: translateY(0px); }
          `,
        }}
      />

      <section
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 26,
          padding: 22,
          background: "var(--bg-soft, #eef3fb)",
          border: "1px solid var(--border-soft, rgba(0,0,0,0.06))",
          boxShadow:
            "10px 10px 26px var(--shadow-dark, rgba(163,177,198,0.85)), -10px -10px 26px var(--shadow-light, rgba(255,255,255,0.95))",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-text-muted, rgba(148,163,184,0.95))",
              margin: 0,
            }}
          >
            Konto
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 8px" }}>
            Passwort vergessen
          </h1>
          <p style={{ margin: 0, color: "rgba(100,116,139,0.95)", lineHeight: 1.4 }}>
            Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir einen Reset-Link.
          </p>
        </div>

        {sent && (
          <div
            style={{
              borderRadius: 16,
              padding: "12px 14px",
              marginTop: 14,
              marginBottom: 14,
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "rgba(22,101,52,0.95)",
              boxShadow:
                "inset 2px 2px 4px rgba(15,23,42,0.08), inset -2px -2px 4px rgba(255,255,255,0.9)",
            }}
          >
            ✅ Wenn ein Konto existiert, wurde ein Reset-Link versendet.
          </div>
        )}

        <form method="POST" action="/api/auth/forgot-password">
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-text-muted, rgba(148,163,184,0.95))",
              marginBottom: 8,
              marginTop: 8,
            }}
          >
            E-Mail
          </label>

          <input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="dein.name@email.ch"
            style={{
              width: "100%",
              borderRadius: 999,
              padding: "12px 14px",
              fontSize: 15,
              outline: "none",
              background: "var(--bg, #e5ecf5)",
              color: "var(--color-text-primary, #111827)",
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow:
                "inset 2px 2px 4px rgba(15,23,42,0.12), inset -2px -2px 4px rgba(255,255,255,0.95)",
            }}
          />

          <button type="submit" className="neoBtnPrimary">
            Reset-Link senden
          </button>
        </form>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/login" className="neoBtnSoft" style={{ color: "var(--color-text-primary, #111827)" }}>
            Zum Login
          </Link>

          <Link href="/" className="neoBtnSoft" style={{ color: "rgba(100,116,139,1)" }}>
            Startseite
          </Link>
        </div>

        <p style={{ marginTop: 14, fontSize: 12, color: "rgba(100,116,139,0.9)" }}>
          Tipp: Wenn du keinen Link bekommst, prüfe bitte auch den Spam-Ordner.
        </p>
      </section>
    </main>
  );
}
