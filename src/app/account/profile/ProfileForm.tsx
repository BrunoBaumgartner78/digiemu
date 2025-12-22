"use client";

import React from "react";
import styles from "./profile.module.css";

type InitialData = {
  displayName: string;
  bio: string;
  websiteUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  avatarUrl: string;
  bannerUrl: string;
  slug: string;
  isPublic: boolean;
};

type Stats = {
  productCount: number;
  level: string;
  badges: string[];
};

type ProfileFormProps = {
  form: InitialData;
  stats: Stats;
  onChange: (field: keyof InitialData, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  saving?: boolean;
  onPreview?: () => void;
};

export default function ProfileForm({
  form,
  stats,
  onChange,
  onSubmit,
  saving = false,
  onPreview,
}: ProfileFormProps) {
  const handlePreviewClick = () => {
    if (!saving) onPreview?.();
  };

  return (
    <form className={styles.profileForm} onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.label} htmlFor="displayName">
          Anzeigename
        </label>
        <input
          className={styles.input}
          id="displayName"
          value={form.displayName}
          onChange={(e) => onChange("displayName", e.target.value)}
          placeholder="z.B. Bruno Baumgartner"
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="bio">
          Bio
        </label>
        <textarea
          className={styles.textarea}
          id="bio"
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Kurzbeschreibung…"
          rows={4}
        />
      </div>

      <div className={`${styles.formRow} ${styles.checkRow}`}>
        <input
          className={styles.checkbox}
          id="isPublic"
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => onChange("isPublic", e.target.checked)}
        />
        <label className={styles.checkLabel} htmlFor="isPublic">
          Profil öffentlich anzeigen
        </label>
      </div>

      <div className={`${styles.formRow} ${styles.readonly}`}>
        <span>
          Level: <b>{stats.level}</b>
        </span>
        <span>
          Produkte: <b>{stats.productCount}</b>
        </span>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={`${styles.neoBtn} ${styles.neoBtnPrimary}`}
          disabled={saving}
        >
          {saving ? "Speichere…" : "Änderungen speichern"}
        </button>

        <button
          type="button"
          className={styles.neoBtn}
          onClick={handlePreviewClick}
          disabled={saving}
        >
          Vorschau
        </button>
      </div>
    </form>
  );
}
