import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// Pusher requires window.Pusher to be set before Echo initialises.
window.Pusher = Pusher;

let echoInstance: Echo<"pusher"> | null = null;

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function getEcho(): Echo<"pusher"> {
  if (!echoInstance) {
    echoInstance = new Echo({
      broadcaster: "pusher",
      key: import.meta.env.VITE_PUSHER_KEY,
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      forceTLS: true,
      // Authenticate private channels with the same Bearer token as API calls.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorizer: ((channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: Error | null, data: unknown) => void) => {
          axios
            .post(
              `${API_BASE}/api/broadcasting/auth`,
              { socket_id: socketId, channel_name: channel.name },
              {
                withCredentials: true,
                withXSRFToken: true,
                headers: {
                  Accept: "application/json",
                },
              }
            )
            .then((res) => callback(null, res.data))
            .catch((err) => callback(err, null));
        },
      })) as any,
    });
  }
  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
