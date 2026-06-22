import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import JSZip from "jszip";

export type ExportableFile = {
  /** URI do arquivo já gerado em cache. */
  uri: string;
  /** Nome final do arquivo (com extensão), usado no zip e no download. */
  name: string;
  mimeType: string;
};

export type DeliveryMode = "share" | "download";

/**
 * Entrega os arquivos exportados de acordo com o modo escolhido:
 * - "share": compartilha. Vários arquivos são compactados em um único .zip
 *   (expo-sharing só envia um arquivo por vez), evitando ter que sair e voltar
 *   do app entre cada um.
 * - "download": (apenas Android) grava os arquivos numa pasta escolhida pelo
 *   usuário via Storage Access Framework, sem abrir o seletor de compartilhar.
 */
export async function deliverFiles(
  files: ExportableFile[],
  mode: DeliveryMode,
  dialogTitle: string,
): Promise<void> {
  if (!files.length) return;

  if (mode === "download") {
    await downloadFilesAndroid(files);
    return;
  }

  // share
  if (files.length === 1) {
    await Sharing.shareAsync(files[0].uri, {
      mimeType: files[0].mimeType,
      dialogTitle,
    });
    return;
  }

  // Múltiplos arquivos → um único .zip.
  const zip = new JSZip();
  for (const f of files) {
    const base64 = await FileSystem.readAsStringAsync(f.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file(f.name, base64, { base64: true });
  }
  const zipBase64 = await zip.generateAsync({ type: "base64" });
  const zipPath = `${FileSystem.cacheDirectory}exportacao_${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(zipPath, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(zipPath, {
    mimeType: "application/zip",
    dialogTitle,
  });
}

/**
 * Grava os arquivos numa pasta local escolhida pelo usuário (Android/SAF).
 * Em outras plataformas, faz fallback para compartilhamento.
 */
async function downloadFilesAndroid(files: ExportableFile[]): Promise<void> {
  if (Platform.OS !== "android") {
    // Sem suporte a download direto fora do Android — cai no compartilhamento.
    await deliverFiles(files, "share", "Exportar");
    return;
  }

  const SAF = FileSystem.StorageAccessFramework;
  const permission = await SAF.requestDirectoryPermissionsAsync();
  if (!permission.granted) return;

  for (const f of files) {
    const base64 = await FileSystem.readAsStringAsync(f.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const destUri = await SAF.createFileAsync(
      permission.directoryUri,
      f.name,
      f.mimeType,
    );
    await FileSystem.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}
