import api from "./axios";

export const getNotifications = async (filter = "all") => {
  const response = await api.get(`/auth/notifications?filter=${filter}`);
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/auth/notifications/unread-count");
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.post(`/auth/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.post("/auth/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/auth/notifications/${notificationId}`);
  return response.data;
};

export const deleteAllNotifications = async () => {
  const response = await api.delete("/auth/notifications/delete-all");
  return response.data;
};