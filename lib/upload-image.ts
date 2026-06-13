import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

function getContentType(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Uploads a local image URI to the given Supabase storage bucket.
 * @param bucket - Supabase storage bucket name.
 * @param uri - Local image URI (file:// or blob URL on web).
 * @param prefix - Folder prefix inside the bucket (e.g. "icons", "alunos").
 * @returns Public URL of the uploaded file, or null on failure.
 */
export async function uploadImage(
  bucket: string,
  uri: string,
  prefix: string,
): Promise<string | null> {
  try {
    const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = getContentType(ext);
    const filePath = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    let fileData: Blob | ArrayBuffer;

    if (Platform.OS === "web") {
      const response = await fetch(uri);
      fileData = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileData = decode(base64);
    }

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, { contentType });

    if (uploadError) throw uploadError;

    if (data) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return publicUrl;
    }
    return null;
  } catch (e) {
    console.error("Erro no upload da imagem:", e);
    return null;
  }
}
