/**
 * smsService.js
 *
 * Pluggable SMS abstraction layer.
 *
 * In development / TEST_MODE: OTP is only logged to the console — no SMS sent.
 *
 * To connect a real provider later (Fast2SMS, MSG91, Twilio etc.):
 *   1. Install the SDK:  npm install fast2sms   (or msg91, twilio)
 *   2. Set the API key in .env:  SMS_API_KEY=your_key
 *   3. Uncomment the relevant provider block below and remove the stub.
 *
 * All callers use:  await smsService.sendOtp(mobile, otp)
 * Return value:    { success: true }  or  throws an Error
 */

const TEST_MODE = process.env.TEST_MODE === "true";
const SMS_PROVIDER = process.env.SMS_PROVIDER || "console"; // "console" | "fast2sms" | "msg91" | "twilio"

// ─────────────────────────────────────────────────────────────
//  CONSOLE (dev / test)
// ─────────────────────────────────────────────────────────────
async function sendViaCONSOLE(mobile, otp, purpose) {
  console.log(
    `[SMS-STUB] Mobile: ${mobile} | OTP: ${otp} | Purpose: ${purpose}`
  );
  return { success: true, provider: "console" };
}

// ─────────────────────────────────────────────────────────────
//  FAST2SMS  (uncomment + npm install fast2sms)
// ─────────────────────────────────────────────────────────────
// const fast2sms = require("fast2sms");
// async function sendViaFast2SMS(mobile, otp, purpose) {
//   const response = await fast2sms.sendMessage({
//     authorization: process.env.SMS_API_KEY,
//     message: `Your Pravazo OTP is ${otp}. Valid for 10 minutes. Do not share it.`,
//     numbers: mobile,
//   });
//   if (!response.return) throw new Error("Fast2SMS failed: " + JSON.stringify(response));
//   return { success: true, provider: "fast2sms" };
// }

// ─────────────────────────────────────────────────────────────
//  MSG91  (uncomment + npm install msg91)
// ─────────────────────────────────────────────────────────────
// const msg91 = require("msg91");
// const client = msg91(process.env.SMS_AUTH_KEY, process.env.MSG91_SENDER_ID, "91");
// async function sendViaMSG91(mobile, otp, purpose) {
//   return new Promise((resolve, reject) => {
//     client.send(mobile, `Your Pravazo OTP is ${otp}. Valid for 10 minutes.`, (err, res) => {
//       if (err) reject(new Error("MSG91 error: " + err.message));
//       else resolve({ success: true, provider: "msg91" });
//     });
//   });
// }

// ─────────────────────────────────────────────────────────────
//  TWILIO  (uncomment + npm install twilio)
// ─────────────────────────────────────────────────────────────
// const twilio = require("twilio");
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// async function sendViaTwilio(mobile, otp, purpose) {
//   await twilioClient.messages.create({
//     body: `Your Pravazo OTP is ${otp}. Valid for 10 minutes. Do not share it.`,
//     from: process.env.TWILIO_FROM_NUMBER,
//     to: `+91${mobile}`,
//   });
//   return { success: true, provider: "twilio" };
// }

// ─────────────────────────────────────────────────────────────
//  ROUTER — pick the right provider
// ─────────────────────────────────────────────────────────────
async function sendOtp(mobile, otp, purpose = "login") {
  if (TEST_MODE || SMS_PROVIDER === "console") {
    return sendViaCONSOLE(mobile, otp, purpose);
  }

  // switch (SMS_PROVIDER) {
  //   case "fast2sms": return sendViaFast2SMS(mobile, otp, purpose);
  //   case "msg91":    return sendViaMSG91(mobile, otp, purpose);
  //   case "twilio":   return sendViaTwilio(mobile, otp, purpose);
  //   default:         return sendViaCONSOLE(mobile, otp, purpose);
  // }

  // Until a real provider is wired, always fall back to console
  return sendViaCONSOLE(mobile, otp, purpose);
}

module.exports = { sendOtp };
