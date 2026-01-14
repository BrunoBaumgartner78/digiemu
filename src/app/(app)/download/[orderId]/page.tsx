// src/app/download/[orderId]/page.tsx
import React from "react";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";

type Params = { orderId: string };

export const dynamic = "force-dynamic";

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100"
      : tone === "warning"
      ? "bg-amber-200/70 text-amber-900 dark:bg-amber-900/35 dark:text-amber-100"
      : tone === "danger"
      ? "bg-rose-200/70 text-rose-900 dark:bg-rose-900/35 dark:text-rose-100"
      : "bg-slate-200/70 text-slate-900 dark:bg-slate-900/35 dark:text-slate-100";

  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
        "shadow-[inset_2px_2px_6px_rgba(0,0,0,.06),inset_-2px_-2px_6px_rgba(255,255,255,.8)]",
        "dark:shadow-[inset_2px_2px_10px_rgba(0,0,0,.35),inset_-2px_-2px_10px_rgba(255,255,255,.06)]",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function IconDownload() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 opacity-80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default async function DownloadPage(props: { params: Promise<Params> }) {
  const session = await getServerSession(auth);

  if (!session?.user) {
    return (
      <main className={styles.root}>
        <div className={styles.container}>
          <div className="neumorph-card p-8 max-w-md w-full mx-auto text-center space-y-4">
            <h1 className="text-xl font-bold">Bitte einloggen</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Du musst eingeloggt sein, um Downloads zu sehen.
            </p>
            <Link href="/auth/login" className="neobtn">
              Zum Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { orderId } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, downloadLink: true },
  });

  if (!order) {
    return (
      <main className={styles.root}>
        <div className={styles.container}>
          <div className="neumorph-card p-8 max-w-md w-full mx-auto text-center space-y-4">
            <h1 className="text-xl font-bold">Download nicht gefunden</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Diese Bestellung existiert nicht (oder wurde gelöscht).
            </p>
            <Link href="/account/downloads" className="neobtn-sm ghost">
              Meine Downloads
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sessionUserId = (session.user as any).id as string | undefined;
  if (!sessionUserId || order.buyerId !== sessionUserId) {
    return (
      <main className={styles.root}>
        <div className={styles.container}>
          <div className="neumorph-card p-8 max-w-md w-full mx-auto text-center space-y-4">
            <h1 className="text-xl font-bold">Zugriff verweigert</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Du hast keinen Zugriff auf diesen Download.
            </p>
            <Link href="/account/downloads" className="neobtn-sm ghost">
              Meine Downloads
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dl = order.downloadLink ?? null;
  const expired = dl ? dl.expiresAt < new Date() : false;
  const reachedLimit = dl ? dl.downloadCount >= dl.maxDownloads : false;

  const title = order.product?.title ?? "Produkt";
  const category = order.product?.category ?? null;

  let state:
    | { tone: "neutral" | "success" | "warning" | "danger"; text: string }
    | null = null;

  if (!dl) state = { tone: "neutral", text: "Download wird vorbereitet …" };
  else if (!dl.isActive) state = { tone: "danger", text: "Download ist deaktiviert" };
  else if (expired) state = { tone: "danger", text: "Download-Link ist abgelaufen" };
  else if (reachedLimit)
    state = {
      tone: "warning",
      text: `Download-Limit erreicht (${dl.downloadCount}/${dl.maxDownloads})`,
    };
  else state = { tone: "success", text: "Bereit zum Download" };

  const showHelp = !!dl && (expired || reachedLimit || !dl.isActive);

  return (
    <main className={styles.root}>
      <div className={styles.container}>
        <div className={`neumorph-card ${styles.card}`}>
          <div className={styles.glowA} />
          <div className={styles.glowB} />

          {/* HEADER */}
          <header className={styles.header}>
            <h1 className={styles.h1}>Download</h1>

            <div className={styles.badges}>
              <Badge tone={state?.tone ?? "neutral"}>{state?.text}</Badge>
              {dl && (
                <Badge tone="neutral">
                  gültig bis {dl.expiresAt.toLocaleDateString("de-CH")}
                </Badge>
              )}
            </div>

            <div className={styles.productWrap}>
              <div className={`neumorph-card ${styles.productCard}`}>
                <div className={styles.productInfo}>
                  <p className={styles.productLabel}>Produkt</p>
                  <p className={styles.productTitle}>{title}</p>

                  <div className={styles.metaChips}>
                    {category && (
                      <span className={styles.chip}>Kategorie: {category}</span>
                    )}
                    <span className={styles.chip}>Status: {order.status}</span>
                  </div>
                </div>

                <div className={styles.iconCircle} aria-hidden="true" title="Download">
                  <IconDownload />
                </div>
              </div>
            </div>
          </header>

          {/* ACTIONS */}
          <section className={styles.actions}>
            {!dl ? (
              <div className="neumorph-card p-6 text-sm text-[var(--text-muted)] text-center">
                Wir bereiten deinen Download vor. Bitte kurz warten und erneut versuchen.
              </div>
            ) : !dl.isActive ? (
              <div className="neumorph-card p-6 text-sm text-rose-600 text-center">
                Download ist deaktiviert. Bitte Support kontaktieren.
              </div>
            ) : expired ? (
              <div className="neumorph-card p-6 text-sm text-rose-600 text-center">
                Dein Download-Link ist abgelaufen.
              </div>
            ) : reachedLimit ? (
              <div className="neumorph-card p-6 text-sm text-amber-700 dark:text-amber-200 text-center">
                Download-Limit erreicht ({dl.downloadCount}/{dl.maxDownloads}).
              </div>
            ) : (
              <div className={styles.downloadRow}>
                <a
                  href={`/api/download/${order.id}`}
                  className={`neobtn primary justify-center ${styles.downloadBtn}`}
                >
                  Jetzt herunterladen
                </a>
              </div>
            )}

            {/* BIG whitespace so it doesn’t feel glued */}
            <div className={styles.navSpacer} />

            <div className={styles.navWrap}>
              <div className={styles.navGrid}>
                <Link href="/account/downloads" className={`neobtn-sm ghost ${styles.navBtn}`}>
                  Meine Downloads
                </Link>

                {order.product?.id ? (
                  <Link
                    href={`/product/${order.product.id}`}
                    className={`neobtn-sm ghost ${styles.navBtn}`}
                  >
                    Produktseite
                  </Link>
                ) : (
                  <span />
                )}

                {showHelp ? (
                  <Link
                    href="/hilfe"
                    className={`neobtn-sm ghost ${styles.navBtn} ${styles.helpFull}`}
                  >
                    Hilfe &amp; FAQ
                  </Link>
                ) : (
                  <span className={styles.helpFull} />
                )}
              </div>
            </div>

            {dl && (
              <div className={styles.footerMeta}>
                <span className={styles.chip}>
                  Downloads: {dl.downloadCount}/{dl.maxDownloads}
                </span>
                <span className={styles.chip}>Order: {order.id.slice(0, 8)}…</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
