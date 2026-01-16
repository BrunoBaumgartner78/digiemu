"use client";
import { useState } from "react";
import { uploadProductFile } from "@/lib/firebaseUpload";

export function ProductUploadClient({ userId, onUpload }: { userId: string; onUpload: (downloadUrl: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) {
      setError("Bitte wähle eine Datei aus.");
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadProductFile(file, userId);
      onUpload(url);
    } catch (_err) {
      setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="product-upload-client">
      <input type="file" accept=".pdf,.zip,.docx,.xlsx,.pptx,.jpg,.png,.mp4,.mov" onChange={handleFileChange} disabled={isUploading} />
      <button type="button" onClick={handleUpload} disabled={isUploading || !file} className="btn-primary mt-2">
        {isUploading ? "Wird hochgeladen..." : "Datei hochladen"}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
