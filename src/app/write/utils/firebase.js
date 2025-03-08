import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "@/utils/firebase";
import toast from "react-hot-toast";

export const uploadFile = async (file, onProgress) => {
  const storage = getStorage(app);
  const fileName = new Date().getTime() + file.name;
  const storageRef = ref(storage, fileName);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, fileName });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (fileName) => {
  if (!fileName) return;

  try {
    const storage = getStorage(app);
    const imageRef = ref(storage, fileName);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}; 