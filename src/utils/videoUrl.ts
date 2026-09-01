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

// Appends a query param without clobbering any the URL already has.
function withQueryParam(url: string, param: string): string {
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

// `enablejsapi=1` lets us postMessage seek commands into the player below
// without loading YouTube's/Vimeo's full JS SDK.
export function buildYouTubeEmbed(url: string): string {
  const embedUrl = url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
  return withQueryParam(embedUrl, "enablejsapi=1");
}

export function buildVimeoEmbed(url: string): string {
  const embedUrl = url.replace("vimeo.com/", "player.vimeo.com/video/");
  return withQueryParam(embedUrl, "api=1");
}

// One-way "jump to this moment" for an embedded player — fire-and-forget,
// no response needed, so it works without the provider's full JS SDK.
export function seekEmbeddedVideo(iframe: HTMLIFrameElement, kind: "youtube" | "vimeo", seconds: number): void {
  const win = iframe.contentWindow;
  if (!win) return;
  if (kind === "youtube") {
    win.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }), "*");
    win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
  } else {
    win.postMessage(JSON.stringify({ method: "setCurrentTime", value: seconds }), "*");
    win.postMessage(JSON.stringify({ method: "play" }), "*");
  }
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
