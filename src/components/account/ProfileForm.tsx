  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement submit logic or leave as placeholder
  };
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProfileFormValues } from "@/lib/profile-validation";
import { ProfileImageUploader } from "@/components/profile/ProfileImageUploader";
import { LoadingButton } from "@/components/ui/loading-button";

type ProfileFormProps = {
  initialProfile: ProfileFormValues & { id?: string | null };
  initialStats?: {
    productCount: number;
    level: string;
    badges: string[];
  };
};

export function ProfileForm({ initialProfile, initialStats }: ProfileFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<ProfileFormValues>({
    displayName: initialProfile.displayName ?? "",
    bio: initialProfile.bio ?? "",
    avatarUrl: initialProfile.avatarUrl ?? "",
    bannerUrl: initialProfile.bannerUrl ?? "",
    websiteUrl: initialProfile.websiteUrl ?? "",
    twitterUrl: initialProfile.twitterUrl ?? "",
    instagramUrl: initialProfile.instagramUrl ?? "",
    tiktokUrl: initialProfile.tiktokUrl ?? "",
    facebookUrl: initialProfile.facebookUrl ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [stats] = useState(initialStats);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // ...existing code or leave empty if not needed
  };
  return (
    <>
      {stats && (
        <section className="profile-stats-card">
          <div className="profile-stats-header">
            <span className="profile-stats-label">Level</span>
            <span className="profile-stats-level">{stats.level}</span>
          </div>
          <div className="profile-stats-body">
            <div className="profile-stats-item">
              <span className="profile-stats-item-label">Produkte</span>
              <span className="profile-stats-item-value">{stats.productCount}</span>
            </div>
          </div>
          {stats.badges.length > 0 && (
            <div className="profile-stats-badges">
              {stats.badges.map((badge) => (
                <span key={badge} className="profile-badge-pill">{badge}</span>
              ))}
            </div>
          )}
        </section>
      )}
      <form className="profile-form" onSubmit={handleSubmit}>
        <ProfileImageUploader
          userId={initialProfile.id ?? ""}
          avatarUrl={values.avatarUrl}
          bannerUrl={values.bannerUrl}
          onAvatarChange={(url) => setValues((prev) => ({ ...prev, avatarUrl: url }))}
          onBannerChange={(url) => setValues((prev) => ({ ...prev, bannerUrl: url }))}
        />

        <div className="profile-form-section">
          <label>
            Anzeigename
            <input
              name="displayName"
              value={values.displayName ?? ""}
              onChange={handleChange}
              placeholder="Dein Shopname / Künstlername"
            />
          </label>
        </div>
        {/* ...existing code... */}
        <label>
          TikTok
          <input
            name="tiktokUrl"
            value={values.tiktokUrl ?? ""}
            onChange={handleChange}
            placeholder="https://tiktok.com/@..."
          />
        </label>
        <label>
          Facebook
          <input
            name="facebookUrl"
            value={values.facebookUrl ?? ""}
            onChange={handleChange}
            placeholder="https://facebook.com/..."
          />
        </label>
      </div>

      <div className="profile-form-actions">
        <LoadingButton type="submit" loading={isSaving}>
          Profil speichern
        </LoadingButton>
      </div>
    </form>
  );
}
