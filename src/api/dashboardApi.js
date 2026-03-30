import api from "./axios";

export const getDashboard = async () => {
  return await api.get("/auth/dashboard");
};