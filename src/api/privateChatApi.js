import api from "./axios";

export const getPrivateConversations = async () => {
  return await api.get("/auth/private-conversations");
};

export const getMutualUsers = async (query = "") => {
  return await api.get(
    `/auth/private-chat/mutual-users?q=${encodeURIComponent(query)}`
  );
};

export const startPrivateConversation = async (userId) => {
  return await api.post(`/auth/private-chat/users/${userId}/start`);
};

export const getPrivateMessages = async (conversationId) => {
  return await api.get(
    `/auth/private-conversations/${conversationId}/messages`
  );
};

export const sendPrivateMessage = async (conversationId, data) => {
  return await api.post(
    `/auth/private-conversations/${conversationId}/messages`,
    data
  );
};

export const sharePrivateAchievement = async (conversationId) => {
  return await api.post(
    `/auth/private-conversations/${conversationId}/share-achievement`
  );
};

export const markPrivateMessagesRead = async (conversationId) => {
  return await api.post(
    `/auth/private-conversations/${conversationId}/mark-read`
  );
};

export const getPrivateMessageReaders = async (messageId) => {
  return await api.get(`/auth/private-messages/${messageId}/readers`);
};