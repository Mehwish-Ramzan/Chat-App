import axios from "axios";
import {HOST} from "../utils/constants.js";

const apiClient = axios.create({
  baseURL: HOST || "http://localhost:5000",
  withCredentials: true,
});

export default apiClient;
