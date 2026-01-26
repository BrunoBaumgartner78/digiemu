"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadProfileImage } from "@/lib/profileUpload";
import { useToast } from "@/components/ui/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";

type ProfileImageUploaderProps = {
  userId: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  onAvatarChange?: (url: string) => void;
  onBannerChange?: (url: string) => void;
};

export function ProfileImageUploader({
  userId,
  avatarUrl,
  bannerUrl,
  onAvatarChange,
  onBannerChange,
}: ProfileImageUploaderProps) {
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    avatarUrl ?? null
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    bannerUrl ?? null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleAvatarFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const url = await uploadProfileImage(file, {
        userId,
        type: "avatar",
      });
      setAvatarPreview(url);
      onAvatarChange?.(url);
      toast({
        title: "Avatar aktualisiert",
        description: "Dein Profilbild wurde erfolgreich gespeichert.",
      });
    } catch (_err) {
      console.error(_err);
      toast({
        variant: "destructive",
        title: "Upload fehlgeschlagen",
        description: "Bitte versuche es später erneut.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const url = await uploadProfileImage(file, {
        userId,
        type: "banner",
      });
      setBannerPreview(url);
      onBannerChange?.(url);
      toast({
        title: "Banner aktualisiert",
        description: "Dein Profilbanner wurde erfolgreich gespeichert.",
      });
    } catch (_err) {
      console.error(_err);
      toast({
        variant: "destructive",
        title: "Upload fehlgeschlagen",
        description: "Bitte versuche es später erneut.",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  return (
    <section className="profile-image-uploader">
      {/* Banner */}
      <div className="profile-banner-upload">
        <div className="profile-banner-preview">
          {bannerPreview ? (
            <div className="w-full h-full relative">
              <Image src={bannerPreview} alt="Profilbanner" fill style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="profile-banner-placeholder">
              <span>Kein Banner gesetzt</span>
            </div>
          )}
        </div>
        <label className="profile-file-input-label">
          <span>Banner ändern</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerFile}
            className="profile-file-input"
          />
        </label>
      </div>

      {/* Avatar */}
      <div className="profile-avatar-upload">
        <div className="profile-avatar-preview">
          {avatarPreview ? (
            <div className="w-24 h-24 relative rounded-full overflow-hidden">
              <Image src={avatarPreview} alt="Avatar" fill style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="profile-avatar-placeholder">
              <span>?</span>
            </div>
          )}
        </div>
        <label className="profile-file-input-label">
          <span>Avatar ändern</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarFile}
            className="profile-file-input"
          />
        </label>
      </div>

      {/* Optional: separate Save-Button, falls du erst nach Formular-Submit speichern willst.
          Da wir hier direkt nach Upload die URL speichern, ist kein zusätzlicher Button nötig.
      */}
      <div className="profile-upload-actions">
        <LoadingButton
          type="button"
          loading={isUploadingAvatar || isUploadingBanner}
          disabled={isUploadingAvatar || isUploadingBanner}
        >
          {isUploadingAvatar || isUploadingBanner
            ? "Lädt..."
            : "Bilder werden automatisch gespeichert"}
        </LoadingButton>
      </div>
    </section>
  );
}
