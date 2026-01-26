"use client";

import styles from "./profile.module.css";
import Image from "next/image";

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
    <section className={styles.previewCard}>
      <div className={styles.previewBanner}>
        {bannerUrl ? (
          <div className={styles.previewBannerImg} style={{ position: "relative" }}>
            <Image src={bannerUrl} alt="Banner" fill style={{ objectFit: "cover" }} />
          </div>
        ) : (
          <div className={styles.previewBannerPlaceholder}>Banner (optional)</div>
        )}

        <div className={styles.previewGlow} />

        <div className={styles.previewOverlay}>
          <div className={styles.previewAvatar}>
            {avatarUrl ? (
              <div className={styles.previewAvatarImg} style={{ position: "relative" }}>
                <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
              </div>
            ) : (
              <div className={styles.previewAvatarFallback}>{safeName.slice(0, 1).toUpperCase()}</div>
            )}
          </div>

          <div className={styles.previewMeta}>
            <div className={styles.previewName}>{safeName}</div>
            <div className={styles.previewSub}>
              <span>{level}</span>
              <span>·</span>
              <span>{productCount} Produkte</span>
              <span>·</span>
              <span className={isPublic ? styles.pillPublic : styles.pillPrivate}>
                {isPublic ? "ÖFFENTLICH" : "PRIVAT"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewBody}>
        <div className={styles.previewBio}>{safeBio}</div>
      </div>
    </section>
  );
}
