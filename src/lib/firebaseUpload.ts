import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";

export async function uploadProductFile(file: File, userId: string) {
  const storage = getStorage(app);
  const storageRef = ref(storage, `products/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
