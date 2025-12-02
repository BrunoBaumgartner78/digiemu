"use client";

import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export async function uploadProfileImage(
  file: File,
  options: {
    userId: string;
    type: "avatar" | "banner";
  }
): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `profiles/${options.userId}/${options.type}.${extension}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
