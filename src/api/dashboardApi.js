import api from "./axios";

export const getDashboard = async () => {
  const res = await api.get("/auth/dashboard");
  return res.data;
};