/**
 * Resolves a user-facing video URL into something we can preview (iframe or <video>).
 */

export function toVimeoEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("vimeo.com")) return null;
    if (host.includes("player.vimeo.com") && parsed.pathname.includes("/video/")) {
      return parsed.toString();
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    const videoId = segments.find((segment) => /^\d+$/.test(segment));
    if (!videoId) return null;
    const hash = parsed.searchParams.get("h");
    return hash
      ? `https://player.vimeo.com/video/${videoId}?h=${encodeURIComponent(hash)}`
      : `https://player.vimeo.com/video/${videoId}`;
  } catch {
    return null;
  }
}

export function toYoutubeEmbedUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      let m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
      m = u.pathname.match(/\/shorts\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideoFileUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return /^https?:\/\//.test(url.trim()) && /\.(mp4|webm|ogg|mov|m4v)$/.test(clean);
}

export type VideoPreviewKind =
  | { kind: "iframe"; src: string; label: "Vimeo" | "YouTube" }
  | { kind: "video"; src: string }
  | { kind: "none" };

export function getVideoPreview(url: string): VideoPreviewKind {
  const t = url.trim();
  if (!t) return { kind: "none" };
  const vimeo = toVimeoEmbedUrl(t);
  if (vimeo) return { kind: "iframe", src: vimeo, label: "Vimeo" };
  const yt = toYoutubeEmbedUrl(t);
  if (yt) return { kind: "iframe", src: yt, label: "YouTube" };
  if (isDirectVideoFileUrl(t)) return { kind: "video", src: t };
  return { kind: "none" };
}

/**
 * First N seconds only — embed “short” preview in admin cards / review, not the full file.
 * @see https://developers.google.com/youtube/player_parameters (end, start)
 */
export const DEFAULT_PREVIEW_MAX_SECONDS = 60;

export function formatPreviewLength(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} seconds`;
  if (totalSeconds % 60 === 0) {
    const m = totalSeconds / 60;
    return m === 1 ? "1 minute" : `${m} minutes`;
  }
  return `${totalSeconds} seconds`;
}

/**
 * YouTube: `end` = stop after this many seconds from the start of the video.
 * Vimeo: time range in URL fragment (supported on many vimeo.com player links).
 */
export function applyShortPreviewToEmbedUrl(
  embedUrl: string,
  label: "Vimeo" | "YouTube",
  maxSeconds: number = DEFAULT_PREVIEW_MAX_SECONDS,
): string {
  try {
    if (label === "YouTube") {
      const u = new URL(embedUrl);
      u.searchParams.set("start", "0");
      u.searchParams.set("end", String(maxSeconds));
      u.searchParams.set("rel", u.searchParams.get("rel") ?? "0");
      return u.toString();
    }
    if (label === "Vimeo") {
      const u = new URL(embedUrl);
      u.searchParams.set("start", "0");
      u.searchParams.set("end", String(maxSeconds));
      u.hash = `t=0,${maxSeconds}`;
      return u.toString();
    }
  } catch {
    // fall through
  }
  return embedUrl;
}

/** Google Drive "view" links are not direct image URLs; use the thumbnail API for preview. */
export function resolveThumbnailForPreview(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  const m = t.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
  }
  return t;
}
