"use client";

import React, { useId, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { compressImageFile } from "@/lib/imageCompress";
import styles from "./profile.module.css";

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
  const bannerInputId = useId();
  const avatarInputId = useId();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { toast } = useToast();

  async function uploadImage(kind: "avatar" | "banner", file: File) {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);

    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    const text = await res.text().catch(() => "");

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      const msg =
        (json && json.message) || `Upload failed (${res.status}): ${text.slice(0, 200)}`;
      throw new Error(msg);
    }
    if (!json || !json.ok) {
      const msg =
        (json && json.message) || `Upload failed (invalid response): ${text.slice(0, 200)}`;
      throw new Error(msg);
    }
    return String(json.url);
  }

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 900,
        mimeType: "image/webp",
        quality: 0.82,
      });
      const url = await uploadImage("banner", compressed);
      onBannerChange(url);
      toast({ title: "Banner hochgeladen", variant: "success" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload fehlgeschlagen",
        description: err?.message ?? "Banner konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
      e.currentTarget.value = "";
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        mimeType: "image/webp",
        quality: 0.82,
      });
      const url = await uploadImage("avatar", compressed);
      onAvatarChange(url);
      toast({ title: "Avatar hochgeladen", variant: "success" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload fehlgeschlagen",
        description: err?.message ?? "Avatar konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      e.currentTarget.value = "";
    }
  };

  return (
    <section className={styles.profileImageUploader}>
      <div className={styles.profileImages}>
        {/* Banner */}
        <div className={styles.imageCard}>
          <div className={styles.uploadHead}>
            <div>
              <div className={styles.uploadTitle}>Banner</div>
              <div className={styles.uploadSub}>Empfohlen: 1600×400</div>
            </div>

            <div className={styles.uploadActions}>
              <input
                id={bannerInputId}
                className={styles.file}
                type="file"
                accept="image/*"
                onChange={handleBannerSelect}
                disabled={uploadingBanner}
              />
              <label
                htmlFor={bannerInputId}
                className={`${styles.neoBtn} ${styles.neoBtnPrimary} ${
                  uploadingBanner ? styles.isDisabled : ""
                }`}
              >
                {uploadingBanner ? "Upload…" : "Datei wählen"}
              </label>
            </div>
          </div>

          <div className={`${styles.imagePreview} ${styles.bannerFrame}`}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="Profilbanner" className={styles.bannerImg} />
            ) : (
              <div className={styles.previewBannerPlaceholder}>Kein Banner hinterlegt</div>
            )}
            {uploadingBanner && <div className={styles.uploadOverlay}>UPLOADING</div>}
          </div>
        </div>

        {/* Avatar */}
        <div className={styles.imageCard}>
          <div className={styles.uploadHead}>
            <div>
              <div className={styles.uploadTitle}>Avatar</div>
              <div className={styles.uploadSub}>Quadratisch, z.B. 512×512</div>
            </div>

            <div className={styles.uploadActions}>
              <input
                id={avatarInputId}
                className={styles.file}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                disabled={uploadingAvatar}
              />
              <label
                htmlFor={avatarInputId}
                className={`${styles.neoBtn} ${styles.neoBtnPrimary} ${
                  uploadingAvatar ? styles.isDisabled : ""
                }`}
              >
                {uploadingAvatar ? "Upload…" : "Datei wählen"}
              </label>
            </div>
          </div>

          <div className={`${styles.imagePreview} ${styles.avatarFrame}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.placeholder}>
                Kein Avatar
                <div className={styles.placeholderSub}>Wird im Marketplace angezeigt</div>
              </div>
            )}
            {uploadingAvatar && <div className={styles.uploadOverlay}>UPLOADING</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
