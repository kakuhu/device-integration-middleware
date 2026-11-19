const attemptTracker = new Map();

async function receiveTransfer(req, res) {
  const { device_id, sender_id, receiver_id } = req.body || {};
  const scenario = req.get("x-demo-scenario") || "success";

  if (!device_id || !sender_id || !receiver_id) {
    return res.status(400).json({
      success: false,
      message: "Invalid external transfer request"
    });
  }

  const allowed = ["success", "temporary_failure", "permanent_failure", "client_error"];
  if (!allowed.includes(scenario)) {
    return res.status(400).json({ success: false, message: "Invalid simulation scenario" });
  }

  const trackerKey = `${device_id}:${scenario}`;
  const attempt = (attemptTracker.get(trackerKey) || 0) + 1;
  attemptTracker.set(trackerKey, attempt);

  console.log(`[MOCK EXTERNAL API] scenario=${scenario} attempt=${attempt} device=${device_id}`);

  if (scenario === "temporary_failure" && attempt <= 2) {
    return res.status(503).json({
      success: false,
      message: "External platform temporarily unavailable",
      attempt
    });
  }

  if (scenario === "permanent_failure") {
    return res.status(503).json({
      success: false,
      message: "External platform is unavailable",
      attempt
    });
  }

  if (scenario === "client_error") {
    return res.status(400).json({
      success: false,
      message: "External platform rejected the request"
    });
  }

  return res.status(200).json({
    success: true,
    message: "External platform accepted transfer",
    transaction_id: `EXT-${Date.now()}-${attempt}`,
    device_id,
    sender_id,
    receiver_id,
    status: "ACCEPTED",
    attempts: attempt
  });
}

module.exports = { receiveTransfer };
