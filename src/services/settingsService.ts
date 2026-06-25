import api from "../api/axios";

export type PublicSettings = Record<string, string>;

export const settingsService = {
  getPublic: () => api.get<{ data: PublicSettings }>("/settings/public"),
};
