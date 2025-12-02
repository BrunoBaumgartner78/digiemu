"use client";

import { useState } from "react";
import ProfileImageUploader from "./ProfileImageUploader";
import ProfileForm from "./ProfileForm";

type InitialData = {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  [key: string]: any;
};

type ProfileStats = {
  level?: string;
  productCount?: number;
  badges?: string[];
};

type ProfilePageClientProps = {
  userId: string;
  initialData: InitialData;
  initialStats: ProfileStats;
};

export default function ProfilePageClient({
  userId,
  initialData,
  initialStats,
}: ProfilePageClientProps) {
  const [form, setForm] = useState<InitialData>(initialData);
  const [stats] = useState<ProfileStats>(initialStats);

  // Fallbacks, falls irgendwas in stats fehlt
  const safeStats: Required<ProfileStats> = {
    level: stats?.level ?? "Starter",
    productCount: stats?.productCount ?? 0,
    badges: stats?.badges ?? [],
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: hier deine bisherige API-Call-Logik einbauen, falls noch nicht vorhanden
    // z.B. fetch("/api/account/profile", { method: "POST", body: JSON.stringify(form) })
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-100/80 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-800">
            Dein Verkäufer-Profil
          </h1>
          <p className="text-sm text-slate-500">
            Banner, Avatar und Profilinfos – so sehen dich deine Kunden auf dem
            Marktplatz.
          </p>
        </header>

        {/* Haupt-Card */}
        <div className="rounded-3xl bg-slate-100 border border-slate-100/60 shadow-[14px_14px_28px_rgba(15,23,42,0.18),_-10px_-10px_24px_rgba(255,255,255,0.9)]">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 space-y-6">
            {/* Stats */}
            <section className="profile-stats-card">
              <div className="profile-stats-header">
                <span className="profile-stats-label">Level</span>
                <span className="profile-stats-level">{safeStats.level}</span>
              </div>
              <div className="profile-stats-body">
                <div className="profile-stats-item">
                  <span className="profile-stats-item-label">Produkte</span>
                  <span className="profile-stats-item-value">
                    {safeStats.productCount}
                  </span>
                </div>
              </div>
              {safeStats.badges.length > 0 && (
                <div className="profile-stats-badges">
                  {safeStats.badges.map((badge) => (
                    <span key={badge} className="profile-badge-pill">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Bild-Uploader (Banner & Avatar) */}
            <ProfileImageUploader
              userId={userId}
              avatarUrl={form.avatarUrl}
              bannerUrl={form.bannerUrl}
              onAvatarChange={(url) =>
                setForm((prev) => ({ ...prev, avatarUrl: url }))
              }
              onBannerChange={(url) =>
                setForm((prev) => ({ ...prev, bannerUrl: url }))
              }
            />

            {/* Formular */}
            <ProfileForm
              form={form}
              stats={safeStats}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
