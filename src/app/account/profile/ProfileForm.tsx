// src/app/account/profile/ProfileForm.tsx
"use client";

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
};

export default function ProfileForm({
  form,
  stats,
  onChange,
  onSubmit,
}: ProfileFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    await onSubmit(e);
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {/* Beispiel-Felder – hier deine bestehenden Inputs einbauen */}
      <div className="form-row">
        <label htmlFor="displayName">Anzeigename</label>
        <input
          id="displayName"
          value={form.displayName}
          onChange={(e) => onChange("displayName", e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
        />
      </div>

      {/* Beispiel: Public-Checkbox */}
      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => onChange("isPublic", e.target.checked)}
          />
          Profil öffentlich anzeigen
        </label>
      </div>

      {/* Du kannst hier bei Bedarf auch Stats lesen, wenn nötig */}
      {/* z.B. read-only Anzeige: */}
      <div className="form-row readonly">
        <span>Level: {stats.level}</span>
        <span>Produkte: {stats.productCount}</span>
      </div>

      <button type="submit" className="primary-button">
        Profil speichern
      </button>
    </form>
  );
}
