type VideoKind = "youtube" | "vimeo" | "direct" | null;

const YOUTUBE = new Set(["www.youtube.com", "youtube.com", "youtu.be"]);
const VIMEO   = new Set(["vimeo.com", "player.vimeo.com"]);

export function classifyVideoUrl(url: string | null | undefined): VideoKind {
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return null;
    if (YOUTUBE.has(hostname)) return "youtube";
    if (VIMEO.has(hostname))   return "vimeo";
    return "direct";
  } catch {
    return null;
  }
}
