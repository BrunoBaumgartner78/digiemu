"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import ProfileImageUploader from "./ProfileImageUploader";
import LoadingButton from "@/components/ui/LoadingButton";

type ProfileFormValues = {
  displayName: string;
  bio: string;
  websiteUrl: string;
  twitterUrl: string;
};

type Props = {
  initialProfile: {
    id?: string | null;
    displayName?: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
    avatarUrl?: string | null;
  };
  initialStats?: unknown;
};

export default function ProfileForm({ initialProfile, initialStats }: Props) {
  const [values, setValues] = useState<ProfileFormValues>({
    displayName: initialProfile.displayName ?? "",
    bio: initialProfile.bio ?? "",
    websiteUrl: initialProfile.websiteUrl ?? "",
    twitterUrl: initialProfile.twitterUrl ?? "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [stats] = useState(initialStats ?? null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Profil konnte nicht gespeichert werden.");
      }
    } catch (_err) {
      console.error(err);
      alert("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {stats && (
        <section className="neo-card-soft p-4 mb-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Profil-Statistiken verfügbar.
          </p>
        </section>
      )}
      <form className="profile-form" onSubmit={handleSubmit}>
        <ProfileImageUploader
          userId={initialProfile.id ?? ""}
          avatarUrl={initialProfile.avatarUrl ?? ""}
        />
        <div className="profile-form-fields">
          <label className="profile-form-field">
            <span>Name</span>
            <input
              name="displayName"
              value={values.displayName}
              onChange={handleChange}
              placeholder="Dein Name"
            />
          </label>
          <label className="profile-form-field">
            <span>Bio</span>
            <textarea
              name="bio"
              value={values.bio}
              onChange={handleChange}
              placeholder="Kurzbeschreibung"
              rows={4}
            />
          </label>
          <label className="profile-form-field">
            <span>Website</span>
            <input
              name="websiteUrl"
              value={values.websiteUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>
          <label className="profile-form-field">
            <span>Twitter / X</span>
            <input
              name="twitterUrl"
              value={values.twitterUrl}
              onChange={handleChange}
              placeholder="https://x.com/..."
            />
          </label>
        </div>
        <div className="profile-form-actions">
          <LoadingButton type="submit" isLoading={isSaving}>
            Speichern
          </LoadingButton>
        </div>
      </form>
    </>
  );
}
