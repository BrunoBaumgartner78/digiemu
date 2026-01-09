"use client";

import * as React from "react";
import styles from "./profile.module.css";
import { useToast } from "@/components/ui/use-toast";

export type InitialProfile = {
  displayName: string;
  bio: string;
  isPublic: boolean;
  avatarUrl: string;
  bannerUrl: string;
  levelName: string;
  productCount: number;
  nextGoal: number;
  nextGoalUnit?: "products" | "chf";
};

function isBlobUrl(url: string) {
  return url?.startsWith("blob:");
}

export default function ProfilePageClient({
  initialProfile,
}: {
  initialProfile: InitialProfile;
}) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = React.useState(initialProfile.displayName);
  const [bio, setBio] = React.useState(initialProfile.bio);
  const [isPublic, setIsPublic] = React.useState(initialProfile.isPublic);

  const [avatarUrl, setAvatarUrl] = React.useState(initialProfile.avatarUrl);
  const [bannerUrl, setBannerUrl] = React.useState(initialProfile.bannerUrl);

  const [saving, setSaving] = React.useState(false);
  const [inlineToast, setInlineToast] = React.useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [avatarProgress, setAvatarProgress] = React.useState(0);
  const [bannerProgress, setBannerProgress] = React.useState(0);

  const products = initialProfile.productCount ?? 0;
  const nextGoal = initialProfile.nextGoal ?? 5;
  const nextGoalUnit = initialProfile.nextGoalUnit ?? "products";

  // progress display: if next target is products, base on product count; if CHF, display revenue progress placeholder
  const progressValue = nextGoalUnit === "products" ? Math.min(products, nextGoal) : 0;
  const pct = Math.round((progressValue / Math.max(1, nextGoal)) * 100);

  const showToast = (msg: string) => {
    setInlineToast(msg);
    window.setTimeout(() => setInlineToast(null), 2600);
  };

  async function uploadViaApi(
    file: File,
    kind: "avatar" | "banner",
    onProgress: (pct: number) => void
  ): Promise<string | null> {
    const maxMb = kind === "banner" ? 6 : 3;
    const maxBytes = maxMb * 1024 * 1024;

    if (!file.type.startsWith("image/")) {
      throw new Error("Bitte nur Bilddateien (PNG/JPG/WebP).");
    }
    if (file.size > maxBytes) {
      toast({
        variant: "destructive",
        title: "Bild zu gross",
        description: `Maximal ${maxMb}MB. Tipp: Bild verkleinern (Export "mittel"), als JPG/WebP speichern oder Screenshot verwenden.`,
      });
      return null;
    }

    // Progress fake (HTTP Upload kann man ohne XHR nicht sauber tracken)
    onProgress(10);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);

    const res = await fetch("/api/upload/profile-image", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Upload fehlgeschlagen");
    }

    onProgress(90);
    const data = (await res.json()) as { url: string };
    onProgress(100);

    if (!data?.url) throw new Error("Upload-URL fehlt");
    return data.url;
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarProgress(0);
    try {
      const url = await uploadViaApi(file, "avatar", setAvatarProgress);
      if (!url) return;
      setAvatarUrl(url);
      showToast("✅ Avatar hochgeladen");
    } catch (e: any) {
      console.error(e);
      showToast(`❌ Avatar Upload: ${e?.message ?? "fehlgeschlagen"}`);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onPickBanner(file: File | null) {
    if (!file) return;
    setUploadingBanner(true);
    setBannerProgress(0);
    try {
      const url = await uploadViaApi(file, "banner", setBannerProgress);
      if (!url) return;
      setBannerUrl(url);
      showToast("✅ Banner hochgeladen");
    } catch (e: any) {
      console.error(e);
      showToast(`❌ Banner Upload: ${e?.message ?? "fehlgeschlagen"}`);
    } finally {
      setUploadingBanner(false);
    }
  }

  function removeImage(kind: "avatar" | "banner") {
    if (kind === "avatar") setAvatarUrl("");
    else setBannerUrl("");
  }

  async function saveProfile() {
    setSaving(true);
    setInlineToast(null);

    try {
      if (isBlobUrl(avatarUrl) || isBlobUrl(bannerUrl)) {
        throw new Error("Bitte keine blob-URLs speichern. Nutze Upload oder URL.");
      }

      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          isPublic,
          avatarUrl,
          bannerUrl,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Save failed");
      }

      showToast("✅ Profil gespeichert");
    } catch (e: any) {
      console.error(e);
      showToast(`❌ Speichern: ${e?.message ?? "fehlgeschlagen"}`);
    } finally {
      setSaving(false);
    }
  }

  function previewScroll() {
    const el = document.getElementById("live-preview");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.stack}>
      <div className={styles.hero}>
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <div className={styles.brandTop}>DIGIEMU</div>
            <div className={styles.brandSub}>DIGITAL MARKETPLACE</div>
          </div>
        </div>

        <h1 className={styles.h1}>Dein Verkäufer-Profil</h1>
        <p className={styles.p}>
          Banner, Avatar und Profilinfos – so sehen dich deine Kunden auf dem Content OS.
        </p>

        <div className={styles.actionRow}>
          <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={previewScroll}>
            Vorschau
          </button>
          <button className={`${styles.btn} ${styles.btnNeon}`} type="button" onClick={saveProfile} disabled={saving}>
            {saving ? "Speichert…" : "Profil speichern"}
          </button>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.pills}>
            <div className={styles.pill}>
              <span className={styles.pillLabel}>LEVEL</span>
              <strong className={styles.pillValue}>{initialProfile.levelName}</strong>
            </div>
            <div className={styles.pill}>
              <span className={styles.pillLabel}>Produkte</span>
              <strong className={styles.pillValue}>{products}</strong>
            </div>
          </div>

          <div className={styles.progressMeta}>
            <span className={styles.progressTitle}>Level-Fortschritt</span>
            <span className={styles.progressCount}>
              {progressValue} / {nextGoal}
            </span>
          </div>

          <div
            className={styles.progressTrack}
            aria-label="Progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuenow={progressValue}
            aria-valuemax={nextGoal}
          >
            <div className={styles.progressBar} style={{ width: `${pct}%` }} />
          </div>

          <div className={styles.tip}>
            {nextGoalUnit === "products" ? (
              <>Tipp: Ab {nextGoal} Produkten steigst du ins nächste Level auf.</>
            ) : (
              <>Tipp: Erreiche CHF {nextGoal.toLocaleString("de-CH")} Umsatz, um ins nächste Level aufzusteigen.</>
            )}
          </div>
        </div>
      </div>

      {/* Uploads */}
      <div className={styles.card}>
        <h2 className={styles.h2}>Profilbilder</h2>
        <p className={styles.small}>Upload → Server → Firebase Storage → URL wird gespeichert.</p>

        {/* Banner */}
        <div className={styles.fieldBlock}>
          <div className={styles.fieldHead}>
            <div>
              <div className={styles.fieldTitle}>Banner</div>
              <div className={styles.fieldHint}>Empfohlen: 1600×400 (max 6MB)</div>
            </div>
          </div>

          <div className={styles.uploadRow}>
            <label className={styles.fileBtn}>
              Datei wählen
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => onPickBanner(e.target.files?.[0] ?? null)}
              />
              <p className={styles.hint}>
                Hinweis: Max. <strong>3&nbsp;MB</strong>. Am besten JPG/WebP (ca. 1200–2000px breit).
                Wenn zu groß: Bild verkleinern/Export &quot;mittel&quot; oder Screenshot verwenden.
              </p>
            </label>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => removeImage("banner")}
              disabled={!bannerUrl || uploadingBanner}
            >
              Entfernen
            </button>
          </div>

          {uploadingBanner ? (
            <div className={styles.uploadMeta}>
              <div className={styles.uploadLabel}>Upload: {bannerProgress}%</div>
              <div className={styles.progressTrackSm}>
                <div className={styles.progressBarSm} style={{ width: `${bannerProgress}%` }} />
              </div>
            </div>
          ) : null}

          {bannerUrl ? (
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.bannerImg} src={bannerUrl} alt="Banner preview" />
            </div>
          ) : null}
        </div>

        {/* Avatar */}
        <div className={styles.fieldBlock}>
          <div className={styles.fieldHead}>
            <div>
              <div className={styles.fieldTitle}>Avatar</div>
              <div className={styles.fieldHint}>Quadratisch, z. B. 512×512 (max 3MB)</div>
            </div>
          </div>

          <div className={styles.uploadRow}>
            <label className={styles.fileBtn}>
              Datei wählen
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
              />
              <p className={styles.hint}>
                Hinweis: Max. <strong>3&nbsp;MB</strong>. Am besten JPG/WebP (ca. 800–1200px).
                Wenn zu groß: Bild in der Galerie verkleinern/Export &quot;mittel&quot; oder Screenshot verwenden.
              </p>
            </label>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => removeImage("avatar")}
              disabled={!avatarUrl || uploadingAvatar}
            >
              Entfernen
            </button>
          </div>

          {uploadingAvatar ? (
            <div className={styles.uploadMeta}>
              <div className={styles.uploadLabel}>Upload: {avatarProgress}%</div>
              <div className={styles.progressTrackSm}>
                <div className={styles.progressBarSm} style={{ width: `${avatarProgress}%` }} />
              </div>
            </div>
          ) : null}

          {avatarUrl ? (
            <div className={styles.avatarRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.avatarImg} src={avatarUrl} alt="Avatar preview" />
              <div className={styles.smallHint}>Wird im Content OS rund angezeigt.</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Text fields */}
      <div className={styles.card}>
        <h2 className={styles.h2}>Profilinfos</h2>

        <label className={styles.label}>Anzeigename</label>
        <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

        <label className={styles.label}>Bio</label>
        <textarea className={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} />

        <label className={styles.checkRow}>
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          <span>Profil öffentlich anzeigen</span>
        </label>

        <div className={styles.actionRowBottom}>
          <button className={`${styles.btn} ${styles.btnNeon}`} type="button" onClick={saveProfile} disabled={saving}>
            {saving ? "Speichert…" : "Änderungen speichern"}
          </button>
          <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={previewScroll}>
            Vorschau
          </button>
        </div>
      </div>

      {/* Preview */}
      <div id="live-preview" className={styles.card}>
        <h2 className={styles.h2}>Live Vorschau</h2>
        <p className={styles.small}>So wirkt dein Profil im Content OS.</p>

        <div className={styles.previewCard}>
          <div
            className={styles.previewBanner}
            style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined }}
          />
          <div className={styles.previewInner}>
            <div className={styles.previewTop}>
              <div className={styles.previewAvatarWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {avatarUrl ? (
                  <img className={styles.previewAvatar} src={avatarUrl} alt="avatar" />
                ) : (
                  <div className={styles.previewAvatarFallback}>N</div>
                )}
              </div>

              <div className={styles.previewMeta}>
                <div className={styles.previewName}>{displayName || "—"}</div>
                <div className={styles.previewSub}>
                  {initialProfile.levelName} · {products} Produkte ·{" "}
                  <span className={styles.badge}>{isPublic ? "ÖFFENTLICH" : "PRIVAT"}</span>
                </div>
              </div>
            </div>

            <div className={styles.previewBio}>{bio || "—"}</div>
          </div>
        </div>

        {inlineToast ? <div className={styles.toast}>{inlineToast}</div> : null}
      </div>
    </div>
  );
}
