"use client";
import { useState } from "react";
import { FileSelect } from "./FileSelect";
import { uploadThumbnail, uploadProductFile } from "@/lib/upload";

type Props = {
  onUploaded: (data: { thumbnail?: string; fileUrl?: string }) => void;
};

export function UploadCard({ onUploaded }: Props) {
  const [thumbUrl, setThumbUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl shadow-xl p-6 flex flex-col gap-4">
      <h3 className="text-lg font-bold">Uploads</h3>

      <FileSelect
        label="Thumbnail auswählen"
        onChange={async (file) => {
          const url = await uploadThumbnail(file);
          setThumbUrl(url);
          onUploaded({ thumbnail: url });
        }}
      />

      {thumbUrl && (
        <img
          src={thumbUrl}
          className="rounded-xl w-32 h-32 object-cover shadow"
        />
      )}

      <FileSelect
        label="Produktdatei hochladen"
        onChange={async (file) => {
          const url = await uploadProductFile(file);
          setFileUrl(url);
          onUploaded({ fileUrl: url });
        }}
      />

      {fileUrl && (
        <p className="text-sm text-blue-600 break-all">{fileUrl}</p>
      )}
    </div>
  );
}
