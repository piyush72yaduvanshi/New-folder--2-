const axios = require("axios");

const razorpayx = axios.create({
  baseURL: "https://api.razorpay.com/v1",
  auth: {
    username: process.env.RAZORPAYX_KEY_ID,
    password: process.env.RAZORPAYX_KEY_SECRET,
  },
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

module.exports = razorpayx;
