import api from "./axios";

export const getGameSummary = async () => {
  const response = await api.get("/auth/game/summary");
  return response.data;
};

export const getLeaderboards = async () => {
  const response = await api.get("/auth/game/leaderboard");
  return response.data;
};

export const getDailyChallenge = async () => {
  const response = await api.get("/auth/game/challenge");
  return response.data;
};

export const rerollDailyChallenge = async () => {
  const response = await api.post("/auth/game/challenge/reroll");
  return response.data;
};

export const submitChallengeProof = async (challengeId, formData) => {
  const response = await api.post(`/auth/game/challenges/${challengeId}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
