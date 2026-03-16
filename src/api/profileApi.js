import api from "./axios";

// GET profile
export const getProfile = () => {
  return api.get("/auth/profile");
};

// UPDATE profile
export const updateProfile = (data) => {
  return api.put("/auth/profile", data);
};

// UPLOAD avatar
export const uploadAvatar = (formData) => {
  return api.post("/auth/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};