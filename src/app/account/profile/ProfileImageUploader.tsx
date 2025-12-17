"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { compressImageFile } from "@/lib/imageCompress";

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { toast } = useToast();

  async function uploadImage(kind: "avatar" | "banner", file: File) {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);

    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    const text = await res.text().catch(() => "");

    // Try to parse JSON response
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      // not JSON
    }

    if (!res.ok) {
      const msg = (json && json.message) || `Upload failed (${res.status}): ${text.slice(0, 200)}`;
      throw new Error(msg);
    }

    if (!json || !json.ok) {
      const msg = (json && json.message) || `Upload failed (invalid response): ${text.slice(0,200)}`;
      throw new Error(msg);
    }

    return String(json.url);
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const compressed = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, mimeType: "image/webp", quality: 0.82 });
      const url = await uploadImage("avatar", compressed);
      onAvatarChange(url);
      toast({ title: "Avatar hochgeladen", variant: "success" });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast({ title: "Upload fehlgeschlagen", description: err?.message ?? "Avatar konnte nicht hochgeladen werden.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 900, mimeType: "image/webp", quality: 0.82 });
      const url = await uploadImage("banner", compressed);
      onBannerChange(url);
      toast({ title: "Banner hochgeladen", variant: "success" });
    } catch (err: any) {
      console.error("Banner upload failed:", err);
      toast({ title: "Upload fehlgeschlagen", description: err?.message ?? "Banner konnte nicht hochgeladen werden.", variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <section className="profile-image-uploader">
      <div className="profile-images">
        {/* Banner */}
        <div className="image-card">
          <div>
            <div className="upload-title">Banner</div>
            <div className="upload-sub">Empfohlen: 1600×400</div>
          </div>

          <div className="image-preview" style={{ marginTop: 8 }}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="Profilbanner" className="banner-img" />
            ) : (
              <div className="banner-placeholder">Kein Banner hinterlegt</div>
            )}
          </div>

          <input className="file" type="file" accept="image/*" onChange={handleBannerSelect} />
        </div>

        {/* Avatar */}
        <div className="image-card">
          <div>
            <div className="upload-title">Avatar</div>
            <div className="upload-sub">Quadratisch, z.B. 512×512</div>
          </div>

          <div className="avatar-preview" style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="public-avatar" style={{ width: 180, height: 180, objectFit: "cover" }} />
            ) : (
              <div className="avatar-placeholder">Kein Avatar hinterlegt</div>
            )}
          </div>

          <input className="file" type="file" accept="image/*" onChange={handleAvatarSelect} />
        </div>
      </div>
    </section>
  );
}
