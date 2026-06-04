import api from "./axios";

export const getGoals = async () => {
  const response = await api.get("/auth/goals");
  return response.data;
};

export const createGoal = async (payload) => {
  const response = await api.post("/auth/goals", payload);
  return response.data;
};

export const updateGoal = async (goalId, payload) => {
  const response = await api.put(`/auth/goals/${goalId}`, payload);
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/auth/goals/${goalId}`);
  return response.data;
};