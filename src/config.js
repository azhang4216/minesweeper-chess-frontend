const API_BASE_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API_URL
        : "http://localhost:4000";

export default API_BASE_URL;
