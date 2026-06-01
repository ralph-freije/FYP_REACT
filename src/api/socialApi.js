import api from "./axios";

export const searchUsers = async (query = "") => {
  return await api.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
};

export const followUser = async (id) => {
  return await api.post(`/auth/users/${id}/follow`);
};

export const unfollowUser = async (id) => {
  return await api.delete(`/auth/users/${id}/unfollow`);
};

export const getFollowingUsers = async () => {
  return await api.get("/auth/users/following");
};

export const getFollowers = async () => {
  return await api.get("/auth/users/followers");
};

export const getSocialProfile = async (id) => {
  return await api.get(`/auth/users/${id}/social-profile`);
};