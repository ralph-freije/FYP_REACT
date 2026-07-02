import api from "./axios";

export const getGoals = async () => {
  const response = await api.get("/auth/personal-goals");
  return response.data;
};


export const suggestGoalDetails = async (payload) => {
  const response = await api.post("/auth/personal-goals/suggest", payload);
  return response.data;
};

export const createGoal = async (payload) => {
  const response = await api.post("/auth/personal-goals", payload);
  return response.data;
};

export const updateGoal = async (goalId, payload) => {
  const response = await api.put(`/auth/personal-goals/${goalId}`, payload);
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/auth/personal-goals/${goalId}`);
  return response.data;
};
