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

export function buildYouTubeEmbed(url: string): string {
  return url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
}

export function buildVimeoEmbed(url: string): string {
  return url.replace("vimeo.com/", "player.vimeo.com/video/");
}

// Reads a video file's length client-side (via a throwaway <video> element)
// so instructors never have to type it in manually.
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration"));
    };
  });
}
