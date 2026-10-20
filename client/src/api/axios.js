import axios from "axios";

const developmentApiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api"
    : undefined;

export default axios.create({
  baseURL: process.env.REACT_APP_API_URL || developmentApiUrl,
});
