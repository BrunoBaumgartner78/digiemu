import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadFile(folder: string, file: File) {
  const fileRef = ref(storage, `${folder}/${crypto.randomUUID()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

export const uploadThumbnail = (file: File) =>
  uploadFile("thumbnails", file);

export const uploadProductFile = (file: File) =>
  uploadFile("products", file);
