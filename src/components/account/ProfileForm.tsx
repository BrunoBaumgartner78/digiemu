  "use client";

  import * as React from "react";
  import ProfileImageUploader from "./ProfileImageUploader";
  import LoadingButton from "@/components/ui/LoadingButton";

  type ProfileFormValues = {
    name: string;
    bio: string;
    website: string;
    location: string;
  };

  type ProfileFormProps = {
    initialProfile: {
      id?: string | null;
      avatarUrl?: string | null;
    };
    initialValues?: Partial<ProfileFormValues>;
    stats?: any;
  };

  export default function ProfileForm({
    initialProfile,
    initialValues,
    stats,
  }: ProfileFormProps) {
    const [values, setValues] = React.useState<ProfileFormValues>({
      name: initialValues?.name ?? "",
      bio: initialValues?.bio ?? "",
      website: initialValues?.website ?? "",
      location: initialValues?.location ?? "",
    });

    const [isSaving, setIsSaving] = React.useState(false);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const res = await fetch("/api/account/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("Failed to update profile");
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <>
        {stats && (
          <section className="neo-card-soft p-4 mb-4">
            <div className="text-xs text-[var(--color-text-muted)]">
              Statistik verfügbar
            </div>
          </section>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <ProfileImageUploader
            userId={initialProfile.id ?? ""}
            avatarUrl={initialProfile.avatarUrl ?? ""}
          />

          <div className="space-y-3 mt-4">
            <label className="block">
              <span className="text-xs text-[var(--color-text-muted)]">
                Name
              </span>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                className="neo-input mt-1 w-full"
                placeholder="Dein Name"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--color-text-muted)]">
                Bio
              </span>
              <textarea
                name="bio"
                value={values.bio}
                onChange={handleChange}
                className="neo-input mt-1 w-full min-h-[120px]"
                placeholder="Kurze Beschreibung…"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Website
                </span>
                <input
                  name="website"
                  value={values.website}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full"
                  placeholder="https://…"
                />
              </label>

              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Ort
                </span>
                <input
                  name="location"
                  value={values.location}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full"
                  placeholder="z.B. Schweiz"
                />
              </label>
            </div>
          </div>

          <div className="profile-form-actions mt-6 flex justify-end">
            <LoadingButton type="submit" isLoading={isSaving}>
              Speichern
            </LoadingButton>
          </div>
        </form>
      </>
    );
  }
  "use client";

  import * as React from "react";
  import ProfileImageUploader from "./ProfileImageUploader";
  import LoadingButton from "@/components/ui/LoadingButton";

  type ProfileFormValues = {
    name: string;
    bio: string;
    website: string;
    location: string;
  };

  type ProfileFormProps = {
    initialProfile: {
      id?: string | null;
      avatarUrl?: string | null;
    };
    initialValues?: Partial<ProfileFormValues>;
    stats?: any;
  };

  export default function ProfileForm({
    initialProfile,
    initialValues,
    stats,
  }: ProfileFormProps) {
    const [values, setValues] = React.useState<ProfileFormValues>({
      name: initialValues?.name ?? "",
      bio: initialValues?.bio ?? "",
      website: initialValues?.website ?? "",
      location: initialValues?.location ?? "",
    });

    const [isSaving, setIsSaving] = React.useState(false);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const res = await fetch("/api/account/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("Failed to update profile");
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <>
        {stats && (
          <section className="neo-card-soft p-4 mb-4">
            <div className="text-xs text-[var(--color-text-muted)]">
              Statistik verfügbar
            </div>
          </section>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <ProfileImageUploader
            userId={initialProfile.id ?? ""}
            avatarUrl={initialProfile.avatarUrl ?? ""}
          />

          <div className="space-y-3 mt-4">
            <label className="block">
              <span className="text-xs text-[var(--color-text-muted)]">Name</span>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                className="neo-input mt-1 w-full"
                placeholder="Dein Name"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--color-text-muted)]">Bio</span>
              <textarea
                name="bio"
                value={values.bio}
                onChange={handleChange}
                className="neo-input mt-1 w-full min-h-[120px]"
                placeholder="Kurze Beschreibung…"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">Website</span>
                <input
                  name="website"
                  value={values.website}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full"
                  placeholder="https://…"
                />
              </label>

              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">Ort</span>
                <input
                  name="location"
                  value={values.location}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full"
                  placeholder="z.B. Schweiz"
                />
              </label>
            </div>
          </div>

          <div className="profile-form-actions mt-6 flex justify-end">
            <LoadingButton type="submit" isLoading={isSaving}>
              Speichern
            </LoadingButton>
          </div>
        </form>
      </>
    );
  }
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

    "use client";

    import * as React from "react";

    // Keep existing imports if they exist in your project; otherwise adjust paths.
    import ProfileImageUploader from "./ProfileImageUploader";
    import LoadingButton from "@/components/ui/LoadingButton";

    // If you already have a toast helper, keep your original import.
    // Otherwise this fallback prevents build errors if toast isn't available.
    // Replace with your real toast import if needed.
    const safeToast = (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => {
      try {
        // @ts-ignore
        if (typeof toast === "function") toast(opts);
      } catch {}
    };

    type ProfileFormValues = {
      name?: string;
      bio?: string;
      website?: string;
      location?: string;
    };

    type ProfileFormProps = {
      initialProfile: {
        id?: string | null;
        avatarUrl?: string | null;
      };
      initialValues?: ProfileFormValues;
      stats?: any; // keep flexible; your existing JSX might render a stats section
    };

    export default function ProfileForm({ initialProfile, initialValues, stats }: ProfileFormProps) {
      const [values, setValues] = React.useState<ProfileFormValues>({
        name: initialValues?.name ?? "",
        bio: initialValues?.bio ?? "",
        website: initialValues?.website ?? "",
        location: initialValues?.location ?? "",
      });

      const [isSaving, setIsSaving] = React.useState(false);

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        try {
          // TODO: Keep your existing endpoint if different.
          const res = await fetch("/api/account/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

          if (!res.ok) {
            throw new Error("Failed to update profile");
          }

          safeToast({
            title: "Profil gespeichert",
            description: "Dein Verkäuferprofil wurde aktualisiert.",
          });
        } catch (err: any) {
          safeToast({
            title: "Fehler",
            description: err?.message ?? "Profil konnte nicht gespeichert werden.",
            variant: "destructive",
          });
        } finally {
          setIsSaving(false);
        }
      };

      return (
        <>
          {stats && (
            <section className="neo-card-soft p-4 mb-4">
              {/* keep your existing stats UI here if you want */}
              <div className="text-xs text-[var(--color-text-muted)]">
                Statistik verfügbar
              </div>
            </section>
          )}

          <form className="profile-form" onSubmit={handleSubmit}>
            <ProfileImageUploader
              userId={initialProfile.id ?? ""}
              avatarUrl={values?.["avatarUrl" as any] ?? initialProfile.avatarUrl ?? ""}
            />

            <div className="space-y-3 mt-4">
              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">Name</span>
                <input
                  name="name"
                  value={values.name ?? ""}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full"
                  placeholder="Dein Name"
                />
              </label>

              <label className="block">
                <span className="text-xs text-[var(--color-text-muted)]">Bio</span>
                <textarea
                  name="bio"
                  value={values.bio ?? ""}
                  onChange={handleChange}
                  className="neo-input mt-1 w-full min-h-[120px]"
                  placeholder="Kurze Beschreibung…"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-[var(--color-text-muted)]">Website</span>
                  <input
                    name="website"
                    value={values.website ?? ""}
                    onChange={handleChange}
                    className="neo-input mt-1 w-full"
                    placeholder="https://…"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--color-text-muted)]">Ort</span>
                  <input
                    name="location"
                    value={values.location ?? ""}
                    onChange={handleChange}
                    className="neo-input mt-1 w-full"
                    placeholder="z.B. Schweiz"
                  />
                </label>
              </div>
            </div>

            <div className="profile-form-actions mt-6 flex justify-end">
              <LoadingButton type="submit" isLoading={isSaving}>
                Speichern
              </LoadingButton>
            </div>
          </form>
        </>
      );
    }
