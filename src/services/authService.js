import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const signupUser = (data) => {
  return axios.post(`${API}/signup`, data);
};

export const loginUser = (data) => {
  return axios.post(`${API}/login`, data);
};