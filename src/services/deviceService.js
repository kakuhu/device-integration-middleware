const { sendTransfer } = require("./externalApiService");

// Deliberately in-memory sample inventory. It resets whenever the server restarts.
const initialDevices = [
  { device_id: "DEV-10001", status: "AVAILABLE", location: "WH-001" },
  { device_id: "DEV-10002", status: "AVAILABLE", location: "WH-001" },
  { device_id: "DEV-10003", status: "IN_USE", location: "AG-002" }
];

let devices = initialDevices.map(device => ({ ...device }));

function resetDevices() {
  devices = initialDevices.map(device => ({ ...device }));
}

async function transferDevice(deviceId, senderId, receiverId) {
  const device = devices.find(item => item.device_id === deviceId);

  if (!device) {
    const error = new Error("Device not found");
    error.statusCode = 404;
    throw error;
  }

  if (device.status !== "AVAILABLE") {
    const error = new Error("Device is not available for transfer");
    error.statusCode = 409;
    throw error;
  }

  if (device.location !== senderId) {
    const error = new Error("Device is not assigned to the specified sender");
    error.statusCode = 409;
    throw error;
  }

  // Local inventory is changed only after the external system confirms success.
  const externalResult = await sendTransfer(deviceId, senderId, receiverId);

  if (!externalResult || externalResult.success !== true) {
    const error = new Error("External platform did not confirm the transfer");
    error.statusCode = 502;
    throw error;
  }

  device.location = receiverId;
  device.status = "TRANSFERRED";

  return {
    success: true,
    message: "Device transferred successfully",
    device_id: deviceId,
    sender_id: senderId,
    receiver_id: receiverId,
    status: device.status,
    external_transaction_id: externalResult.transaction_id
  };
}

function getDevices() {
  return devices.map(device => ({ ...device }));
}

module.exports = { transferDevice, getDevices, resetDevices };
