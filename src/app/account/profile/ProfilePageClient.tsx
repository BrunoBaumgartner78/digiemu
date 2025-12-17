"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "./ProfileImageUploader";
import ProfileForm from "./ProfileForm";
import ProfilePreviewCard from "./ProfilePreviewCard";
import styles from "./profile.module.css";
import { useToast } from "@/components/ui/use-toast";

// optional (wenn du das CSS wirklich angelegt hast)
// import "./profile-neo.css";

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

type ProfileStats = {
  level?: string;
  productCount?: number;
  badges?: string[];
};

type ProfilePageClientProps = {
  userId: string;
  initialData: Partial<InitialData> | null;
  initialStats: ProfileStats;
  vendorProfileId?: string | null;
};

function normalizeInitialData(partial: Partial<InitialData> | null | undefined): InitialData {
  return {
    displayName: partial?.displayName ?? "",
    bio: partial?.bio ?? "",
    websiteUrl: partial?.websiteUrl ?? "",
    instagramUrl: partial?.instagramUrl ?? "",
    twitterUrl: partial?.twitterUrl ?? "",
    tiktokUrl: partial?.tiktokUrl ?? "",
    facebookUrl: partial?.facebookUrl ?? "",
    avatarUrl: partial?.avatarUrl ?? "",
    bannerUrl: partial?.bannerUrl ?? "",
    slug: partial?.slug ?? "",
    isPublic: partial?.isPublic ?? true,
  };
}

export default function ProfilePageClient({
  userId,
  initialData,
  initialStats,
  vendorProfileId,
}: ProfilePageClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const normalizedInitialData = useMemo(() => normalizeInitialData(initialData), [initialData]);
  const [form, setForm] = useState<InitialData>(normalizedInitialData);
  const [dirty, setDirty] = useState(false);
  const [stats] = useState<ProfileStats>(initialStats);
  const [saving, setSaving] = useState(false);

  // ✅ wichtig: die echte VendorProfile.id merken (optional)
  const [profileId, setProfileId] = useState<string | null>(vendorProfileId ?? null);

  const safeStats = useMemo(
    () => ({
      level: stats?.level ?? "Starter",
      productCount: stats?.productCount ?? 0,
      badges: stats?.badges ?? [],
    }),
    [stats]
  );

  const handleChange = (field: keyof InitialData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
    setDirty(true);
  };

  // ✅ Saubere Save-Funktion, die auch Preview benutzen kann
  const saveProfile = async (): Promise<{ slug?: string; isPublic?: boolean; id?: string } | null> => {
    setSaving(true);
    try {
      if (form.avatarUrl?.startsWith("blob:") || form.bannerUrl?.startsWith("blob:")) {
        toast({
          title: "Bilder noch nicht hochgeladen",
          description: "Bitte Avatar/Banner zuerst hochladen (keine blob:-URL).",
          variant: "destructive",
        });
        return null;
      }

      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Fehler beim Speichern");

      const p = json?.profile ?? json ?? {};
      if (typeof p?.id === "string") setProfileId(p.id);

      setForm((prev) => ({
        ...prev,
        ...(p.slug ? { slug: String(p.slug) } : {}),
        ...(typeof p.isPublic === "boolean" ? { isPublic: Boolean(p.isPublic) } : {}),
      }));

      setDirty(false);

      toast({ title: "Profil gespeichert", variant: "success" });
      router.refresh();

      return {
        slug: typeof p.slug === "string" ? p.slug : undefined,
        isPublic: typeof p.isPublic === "boolean" ? p.isPublic : undefined,
        id: typeof p.id === "string" ? p.id : undefined,
      };
    } catch (err: any) {
      toast({
        title: "Fehler beim Speichern",
        description: err?.message || "Unbekannter Fehler",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  const PREVIEW_NEW_TAB = false;

  const openPreview = (slug: string) => {
    const url = `/profile/${encodeURIComponent(slug)}`;
    if (PREVIEW_NEW_TAB) window.open(url, "_blank", "noopener,noreferrer");
    else router.push(url);
  };

  const handlePreviewClick = async () => {
    console.log("PREVIEW_CLICK", { slug: form.slug, isPublic: form.isPublic, dirty });

    if (!form.isPublic) {
      toast({
        title: "Profil nicht öffentlich",
        description: "Aktiviere 'Profil öffentlich anzeigen', um die öffentliche Vorschau zu sehen.",
        variant: "destructive",
      });
      return;
    }

    // Wenn slug fehlt oder ungespeicherte Änderungen: speichern -> dann öffnen
    if (!form.slug || dirty) {
      const saved = await saveProfile();
      const slug = saved?.slug || form.slug; // fallback, falls state noch nicht aktualisiert ist
      if (!slug) {
        toast({
          title: "Vorschau nicht möglich",
          description: "Bitte Profil speichern (Slug fehlt).",
          variant: "destructive",
        });
        return;
      }
      openPreview(slug);
      return;
    }

    openPreview(form.slug);
  };

  return (
    <div className={styles["profile-shell"]}>
      <div className={styles["profile-wrap"]}>
        <header className={styles["profile-header"]}>
          <div>
            <h1 className={styles["profile-title"]}>Dein Verkäufer-Profil</h1>
            <p className={styles["profile-sub"]}>Banner, Avatar und Profilinfos – so sehen dich deine Kunden auf dem Marktplatz.</p>
          </div>

          <div className={styles["profile-actions"]}>
            <button
              type="button"
              className={`${styles["neo-btn"]} ${styles["neo-btn--primary"]} ${saving ? styles["is-disabled"] : ""}`}
              onClick={handlePreviewClick}
              disabled={saving}
              aria-label="Öffentliche Profil-Vorschau ansehen"
            >
              {saving ? "Speichern…" : "Vorschau"}
            </button>
          </div>
        </header>

        <section className={`${styles["profile-neo-card"]} ${styles["profile-stats"] || ""}`}>
          <div className={styles["profile-stats-row"]}>
            <div className={styles["profile-pill"]}>
              <span style={{ opacity: 0.7, fontWeight: 700, marginRight: 8 }}>LEVEL</span>
              <span style={{ fontWeight: 800 }}>{safeStats.level}</span>
            </div>

            <div className={styles["profile-pill"]}>
              <span style={{ opacity: 0.7, fontWeight: 700, marginRight: 8 }}>Produkte</span>
              <span style={{ fontWeight: 900 }}>{safeStats.productCount}</span>
            </div>
          </div>

          {safeStats.badges.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {safeStats.badges.map((badge) => (
                <span key={badge} className={styles["profile-pill"]}>
                  {badge}
                </span>
              ))}
            </div>
          )}

          <div className={styles["profile-progress"]} style={{ ["--progress" as any]: `${Math.min(100, Math.round((safeStats.productCount / 5) * 100))}%` }}>
            <div className={styles["profile-progress__row"]}>
              <span>Level-Fortschritt</span>
              <span>{safeStats.productCount} / 5</span>
            </div>
            <div className={styles["profile-progress__bar"]}>
              <div className={styles["profile-progress__fill"]} style={{ width: `${Math.min(100, Math.round((safeStats.productCount / 5) * 100))}%` }} />
            </div>
          </div>
        </section>

        <div className={styles["profile-grid"]}>
          <div>
            <div className={`${styles["profile-neo-card"]} image-card`}>
              <h3>Profilbilder</h3>
              <div className="mt-2">
                <ProfileImageUploader
                  userId={userId}
                  avatarUrl={form.avatarUrl}
                  bannerUrl={form.bannerUrl}
                  onAvatarChange={(url) => {
                    setForm((prev) => ({ ...prev, avatarUrl: url }));
                    setDirty(true);
                  }}
                  onBannerChange={(url) => {
                    setForm((prev) => ({ ...prev, bannerUrl: url }));
                    setDirty(true);
                  }}
                />
              </div>
            </div>

            <div className={`${styles["profile-neo-card"]} mt-4`}> 
              <ProfileForm
                form={form}
                stats={safeStats}
                onChange={handleChange}
                onSubmit={handleSubmit}
                saving={saving}
                onPreview={handlePreviewClick}
              />
            </div>
          </div>

          <aside className={styles["profile-preview-card"]}>
            <div className={`${styles["profile-neo-card"]}`}>
              <ProfilePreviewCard
                displayName={form.displayName}
                bio={form.bio}
                avatarUrl={form.avatarUrl}
                bannerUrl={form.bannerUrl}
                level={safeStats.level}
                productCount={safeStats.productCount}
                isPublic={form.isPublic}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
