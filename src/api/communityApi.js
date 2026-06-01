import api from "./axios";

export const getCommunities = async () => {
  return await api.get("/auth/communities");
};

export const createCommunity = async (data) => {
  return await api.post("/auth/communities", data);
};

export const getCommunity = async (id) => {
  return await api.get(`/auth/communities/${id}`);
};

export const joinCommunity = async (id) => {
  return await api.post(`/auth/communities/${id}/join`);
};

export const leaveCommunity = async (id) => {
  return await api.delete(`/auth/communities/${id}/leave`);
};

export const addCommunityGoal = async (id, data) => {
  return await api.post(`/auth/communities/${id}/goals`, data);
};

export const getCommunityMessages = async (id) => {
  return await api.get(`/auth/communities/${id}/messages`);
};

export const sendCommunityMessage = async (id, data) => {
  return await api.post(`/auth/communities/${id}/messages`, data);
};

export const shareCommunityAchievement = async (id) => {
  return await api.post(`/auth/communities/${id}/share-achievement`);
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

export const markCommunityMessagesRead = async (id) => {
  return await api.post(`/auth/communities/${id}/messages/mark-read`);
};

export const getMessageReaders = async (id) => {
  return await api.get(`/auth/messages/${id}/readers`);
};
export const updateCommunity = async (id, data) => {
  return await api.put(`/auth/communities/${id}`, data);
};

export const uploadCommunityImage = async (id, data) => {
  return await api.post(`/auth/communities/${id}/image`, data);
};
export const removeCommunityMember = async (communityId, userId) => {
  return await api.delete(`/auth/communities/${communityId}/members/${userId}`);
};