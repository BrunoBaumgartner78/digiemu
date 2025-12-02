"use client";

import { useState } from "react";
import { UploadCard } from "@/components/dashboard/UploadCard";

type ProfileMediaUploadProps = {
  label: string;
  initialUrl?: string | null;
  onChange: (url: string) => void;
  variant?: "avatar" | "banner";
};

export function ProfileMediaUpload({
  label,
  initialUrl,
  onChange,
  variant = "avatar",
}: ProfileMediaUploadProps) {
  const [url, setUrl] = useState(initialUrl ?? "");

  const handleUploaded = (uploadedUrl: string) => {
    setUrl(uploadedUrl);
    onChange(uploadedUrl);
  };

  return (
    <div className={`profile-media-upload profile-media-${variant}`}>
      <div className="profile-media-header">
        <h3>{label}</h3>
        {url && (
          <div className="profile-media-preview">
            <img
              src={url}
              alt={label}
              className={variant === "avatar" ? "avatar-preview" : "banner-preview"}
            />
          </div>
        )}
      </div>
      <UploadCard onUploaded={handleUploaded} />
    </div>
  );
}
