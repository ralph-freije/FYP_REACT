import api from "./axios";

export const getLeaderboards = async () => {
  return await api.get("/auth/leaderboards");
};

export const getMiniLeaderboards = async () => {
  return await api.get("/auth/leaderboards/mini");
};

export const getCommunityLeaderboard = async (communityId) => {
  return await api.get(`/auth/communities/${communityId}/leaderboard`);
};
