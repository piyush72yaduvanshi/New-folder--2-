const axios = require("axios");

const razorpayx = axios.create({
  baseURL: process.env.RAZORPAYX_BASE_URL || "https://api.razorpay.com/v1",
  auth: {
    username: process.env.RAZORPAYX_KEY_ID,
    password: process.env.RAZORPAYX_KEY_SECRET,
  },
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

module.exports = razorpayx;