import type { PublicGameState, RevealPayload, VerifyResponse } from "@/game/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "network", "Sin conexión. Comprueba internet y vuelve a intentarlo.");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new ApiError(res.status, body.error ?? "error", body.message ?? "Algo ha fallado. Inténtalo de nuevo.");
  return body as T;
}

export function createApi(token: string) {
  const base = `/api/game/${encodeURIComponent(token)}`;
  const post = <T,>(path: string, data: unknown) =>
    call<T>(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return {
    state: () => call<{ state: PublicGameState }>(base),
    action: (action: "start" | "depart" | "arrive" | "meet") => post<{ state: PublicGameState }>("/action", { action }),
    answer: (level: number, optionId: string) => post<{ state: PublicGameState }>("/answer", { level, optionId }),
    verify: (photo: Blob) => {
      const fd = new FormData();
      fd.append("photo", photo, "evidence.jpg");
      return call<VerifyResponse>(base + "/verify", { method: "POST", body: fd });
    },
    result: () => call<{ reveal: RevealPayload }>(base + "/result"),
  };
}
export type Api = ReturnType<typeof createApi>;

/** Downscale + re-encode on the device: smaller upload, fixes EXIF rotation, converts HEIC when the browser can decode it. */
export async function preparePhoto(file: File): Promise<Blob> {
  const MAX = 1568;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k);
    const h = Math.round(bmp.height * k);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (blob) return blob;
  } catch {
    /* fall back to the original file */
  }
  return file;
}
