const { transferDevice } = require("../services/deviceService");
const { runIdempotently } = require("../services/idempotencyService");
const { recordTransaction } = require("../services/transactionLogger");

async function processTransfer(req, res) {
  const { device_id, sender_id, receiver_id } = req.body || {};

  if (!device_id || !sender_id || !receiver_id) {
    return res.status(400).json({
      success: false,
      message: "device_id, sender_id and receiver_id are required"
    });
  }

  if (sender_id === receiver_id) {
    return res.status(400).json({
      success: false,
      message: "Sender and receiver cannot be the same"
    });
  }

  const idempotencyKey = req.get("Idempotency-Key");
  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: "Idempotency-Key header is required"
    });
  }

  const fingerprint = JSON.stringify({ device_id, sender_id, receiver_id });

  try {
    const { result, replayed } = await runIdempotently(
      idempotencyKey,
      fingerprint,
      () => transferDevice(device_id, sender_id, receiver_id)
    );

    if (!replayed) {
      recordTransaction({
        event: "TRANSFER_SUCCEEDED",
        idempotency_key: idempotencyKey,
        device_id,
        sender_id,
        receiver_id,
        external_transaction_id: result.external_transaction_id,
        status: result.status
      });
    }

    return res.status(200).json({ ...result, idempotent_replay: replayed });
  } catch (error) {
    const statusCode = error.statusCode || 400;

    if (error.code === "IDEMPOTENCY_CONFLICT") {
      return res.status(409).json({ success: false, message: error.message });
    }

    recordTransaction({
      event: "TRANSFER_FAILED",
      idempotency_key: idempotencyKey,
      device_id,
      sender_id,
      receiver_id,
      message: error.message,
      attempts: error.attempts || 1
    });

    return res.status(statusCode).json({
      success: false,
      message: error.message,
      attempts: error.attempts || 1
    });
  }
}

module.exports = { processTransfer };
