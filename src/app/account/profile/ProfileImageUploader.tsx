"use client";

import React from "react";

type ProfileImageUploaderProps = {
  userId: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  onAvatarChange: (url: string) => void;
  onBannerChange: (url: string) => void;
};

export default function ProfileImageUploader({
  userId,
  avatarUrl,
  bannerUrl,
  onAvatarChange,
  onBannerChange,
}: ProfileImageUploaderProps) {
  // Aktuell: nur lokale Preview + Callback
  // TODO: Hier später echten Upload (Firebase / API) einbauen
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onAvatarChange(previewUrl);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onBannerChange(previewUrl);
  };

  return (
    <section className="profile-image-uploader">
      <h2>Profilbilder</h2>

      {/* Banner */}
      <div className="profile-banner-upload">
        <label className="profile-upload-label">Banner</label>
        <div className="profile-banner-preview">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Profilbanner" className="profile-banner-img" />
          ) : (
            <div className="profile-banner-placeholder">
              Kein Banner hinterlegt
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleBannerSelect}
        />
      </div>

      {/* Avatar */}
      <div className="profile-avatar-upload">
        <label className="profile-upload-label">Avatar</label>
        <div className="profile-avatar-preview">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">
              Kein Avatar hinterlegt
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
        />
      </div>
    </section>
  );
}
