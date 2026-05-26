import api from "../api/axios";

export const instructorService = {
  apply: (formData: FormData) =>
    api.post("/users/instructor/apply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
