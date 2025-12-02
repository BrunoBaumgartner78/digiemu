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

export function ProfileForm({ initialProfile }: ProfileFormProps) {
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
      </form>
    </>
        description: "Dein Verkäuferprofil wurde aktualisiert.",
      });
    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err?.message ?? "Profil konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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

      <div className="profile-form-section">
        <label>
          Über dich
          <textarea
            name="bio"
            value={values.bio ?? ""}
            onChange={handleChange}
            placeholder="Beschreibe kurz dich, deinen Stil und was du anbietest."
            rows={5}
          />
        </label>
      </div>

      <div className="profile-form-grid">
        <label>
          Website
          <input
            name="websiteUrl"
            value={values.websiteUrl ?? ""}
            onChange={handleChange}
            placeholder="https://deine-website.ch"
          />
        </label>
        <label>
          Twitter / X
          <input
            name="twitterUrl"
            value={values.twitterUrl ?? ""}
            onChange={handleChange}
            placeholder="https://twitter.com/..."
          />
        </label>
        <label>
          Instagram
          <input
            name="instagramUrl"
            value={values.instagramUrl ?? ""}
            onChange={handleChange}
            placeholder="https://instagram.com/..."
          />
        </label>
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
