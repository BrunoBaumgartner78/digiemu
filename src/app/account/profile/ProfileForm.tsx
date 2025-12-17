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
  saving?: boolean;
  onPreview?: () => void;
};

export default function ProfileForm({ form, stats, onChange, onSubmit, saving, onPreview }: ProfileFormProps) {
  return (
    <form className="profile-form" onSubmit={onSubmit}>
  <div className="form-grid">
        <label htmlFor="displayName">Anzeigename</label>
        <input
          id="displayName"
          value={form.displayName}
          onChange={(e) => onChange("displayName", e.target.value)}
          placeholder="z.B. Bruno Baumgartner"
        />
      </div>

      <div className="form-row">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Kurzbeschreibung…"
        />
      </div>

      <div className="form-row checkrow">
        <input
          id="isPublic"
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => onChange("isPublic", e.target.checked)}
        />
        <label htmlFor="isPublic">Profil öffentlich anzeigen</label>
      </div>

      <div className="form-row readonly">
        <span>Level: <b>{stats.level}</b></span>
        <span>Produkte: <b>{stats.productCount}</b></span>
      </div>

      <div className="actions">
        <button type="submit" className="neobtn" disabled={saving}>
          {saving ? "Speichere…" : "Profil speichern"}
        </button>
        <button type="button" className="neobtn ghost" onClick={() => (typeof (onPreview as any) === "function" ? (onPreview as any)() : undefined)}>
          Vorschau
        </button>
      </div>
    </form>
  );
}
