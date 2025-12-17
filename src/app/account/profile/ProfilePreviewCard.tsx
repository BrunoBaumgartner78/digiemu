"use client";

type PreviewProps = {
  displayName: string;
  bio: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  level: string;
  productCount: number;
  isPublic: boolean;
};

export default function ProfilePreviewCard({
  displayName,
  bio,
  avatarUrl,
  bannerUrl,
  level,
  productCount,
  isPublic,
}: PreviewProps) {
  const safeName = displayName?.trim() || "Neuer Verkäufer";
  const safeBio = bio?.trim() || "Noch keine Bio hinterlegt.";

  return (
    <section className="neo-card profile-preview">
      <div className="profile-preview__banner">
        {bannerUrl ? (
          <img className="profile-preview__bannerImg" src={bannerUrl} alt="Banner" />
        ) : (
          <div className="profile-preview__bannerPlaceholder">Banner (optional)</div>
        )}

        <div className="profile-preview__overlay">
          <div className="profile-preview__avatar">
            {avatarUrl ? (
              <img className="profile-preview__avatarImg" src={avatarUrl} alt="Avatar" />
            ) : (
              <div className="profile-preview__avatarPlaceholder">A</div>
            )}
          </div>

          <div className="profile-preview__meta">
            <div className="profile-preview__name">{safeName}</div>
            <div className="profile-preview__sub">
              {level} · {productCount} Produkte · {isPublic ? "Öffentlich" : "Privat"}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-preview__body">
        <div className="profile-preview__bio">{safeBio}</div>
      </div>
    </section>
  );
}
