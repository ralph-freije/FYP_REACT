import api from "./axios";

export const getDailyChallenges = async () => {
  const response = await api.get("/auth/challenges");
  return response.data;
};

export const getChallengeHistory = async (params = {}) => {
  const response = await api.get("/auth/challenges/history", { params });
  return response.data;
};

export const getChallengeShareTargets = async () => {
  const response = await api.get("/auth/challenges/share-targets");
  return response.data;
};

export const submitChallengeProof = async (challengeId, file) => {
  const formData = new FormData();
  formData.append("proof", file);
  const response = await api.post(`/auth/challenges/${challengeId}/proof`, formData);
  return response.data;
};

export const shareCompletedChallenge = async (userChallengeId, payload) => {
  const response = await api.post(`/auth/challenges/history/${userChallengeId}/share`, payload);
  return response.data;
};

export const getAdminChallenges = async (params = {}) => {
  const response = await api.get("/auth/admin/challenges", { params });
  return response.data;
};

export const createAdminChallenge = async (payload) => {
  const response = await api.post("/auth/admin/challenges", payload);
  return response.data;
};

export const updateAdminChallenge = async (challengeId, payload) => {
  const response = await api.put(`/auth/admin/challenges/${challengeId}`, payload);
  return response.data;
};

export const deleteAdminChallenge = async (challengeId) => {
  const response = await api.delete(`/auth/admin/challenges/${challengeId}`);
  return response.data;
};

export const suggestAdminChallenge = async (payload) => {
  const response = await api.post("/auth/admin/challenges/ai-assist", payload);
  return response.data;
};
