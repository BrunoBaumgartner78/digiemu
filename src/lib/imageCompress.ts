export type CompressOptions = {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // 0..1
  mimeType?: "image/webp" | "image/jpeg";
};

export async function compressImageFile(file: File, opts: CompressOptions): Promise<File> {
  const quality = opts.quality ?? 0.82;
  const mimeType = opts.mimeType ?? "image/webp";

  const img = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = url;
    });

    const { width, height } = img;
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height, 1);
    const targetW = Math.max(1, Math.round(width * ratio));
    const targetH = Math.max(1, Math.round(height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression failed"))), mimeType, quality);
    });

    const ext = mimeType === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;

    return new File([blob], name, { type: mimeType });
  } finally {
    URL.revokeObjectURL(url);
  }
}
