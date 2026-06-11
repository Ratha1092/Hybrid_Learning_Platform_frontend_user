interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: GoogleIdConfiguration) => void;
      prompt: () => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
      disableAutoSelect: () => void;
    };
  };
}

declare const google: Google;
