const axios = require("axios");

const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 3);
const BASE_DELAY_MS = Number(process.env.RETRY_BASE_DELAY_MS || 500);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const EXTERNAL_API_URL =
  process.env.EXTERNAL_API_URL || "http://localhost:5000/api/external/transfer";

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTransfer(deviceId, senderId, receiverId) {
  let lastError;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attemptsMade = attempt;

    try {
      console.log(`[INTEGRATION] External API attempt ${attempt}/${MAX_ATTEMPTS}`);

      const response = await axios.post(
        EXTERNAL_API_URL,
        {
          device_id: deviceId,
          sender_id: senderId,
          receiver_id: receiverId
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            "x-demo-scenario": process.env.DEMO_EXTERNAL_SCENARIO || "success"
          }
        }
      );

      return response.data;
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;

      // Retry network errors, HTTP 429 and server-side 5xx errors only.
      const retryable = !statusCode || statusCode === 429 || statusCode >= 500;

      console.error(`[INTEGRATION] Attempt ${attempt} failed: ${error.message}`);

      if (!retryable || attempt === MAX_ATTEMPTS) break;

      const delay = BASE_DELAY_MS * attempt;
      console.log(`[INTEGRATION] Retrying in ${delay}ms`);
      await wait(delay);
    }
  }

  const finalError = new Error(
    lastError?.response?.data?.message ||
    lastError?.message ||
    "External API communication failed"
  );
  finalError.statusCode = lastError?.response?.status || 503;
  finalError.attempts = attemptsMade;
  throw finalError;
}

module.exports = { sendTransfer };
