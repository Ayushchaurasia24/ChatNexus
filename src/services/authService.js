import api from "./api";

export const signupUser = (data) => api.post("/api/auth/signup", data);
export const loginUser = (data) => api.post("/api/auth/login", data);
export const getUserByEmail = (email) => api.get(`/api/auth/user?email=${encodeURIComponent(email)}`);
