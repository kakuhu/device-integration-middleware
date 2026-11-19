jest.mock("../src/services/externalApiService", () => ({
  sendTransfer: jest.fn()
}));

const request = require("supertest");
const app = require("../src/app");
const { sendTransfer } = require("../src/services/externalApiService");
const { resetDevices } = require("../src/services/deviceService");

beforeEach(() => {
  resetDevices();
  sendTransfer.mockReset();
  sendTransfer.mockResolvedValue({
    success: true,
    transaction_id: "EXT-TEST-001"
  });
});

describe("POST /api/transfer", () => {
  test("rejects a request missing required fields", async () => {
    const response = await request(app).post("/api/transfer").send({ device_id: "DEV-10001" });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("requires an Idempotency-Key header", async () => {
    const response = await request(app).post("/api/transfer").send({
      device_id: "DEV-10001", sender_id: "WH-001", receiver_id: "AG-020"
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Idempotency-Key/);
  });

  test("transfers an available device successfully", async () => {
    const response = await request(app)
      .post("/api/transfer")
      .set("Idempotency-Key", "test-success-1")
      .send({ device_id: "DEV-10001", sender_id: "WH-001", receiver_id: "AG-020" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.external_transaction_id).toBe("EXT-TEST-001");
    expect(response.body.idempotent_replay).toBe(false);
    expect(sendTransfer).toHaveBeenCalledTimes(1);
  });

  test("returns the saved result for a repeated request without calling external API again", async () => {
    const payload = { device_id: "DEV-10002", sender_id: "WH-001", receiver_id: "AG-021" };

    const first = await request(app).post("/api/transfer")
      .set("Idempotency-Key", "same-request-key").send(payload);
    const second = await request(app).post("/api/transfer")
      .set("Idempotency-Key", "same-request-key").send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.idempotent_replay).toBe(true);
    expect(sendTransfer).toHaveBeenCalledTimes(1);
  });

  test("rejects reuse of an idempotency key for different request data", async () => {
    const first = await request(app).post("/api/transfer")
      .set("Idempotency-Key", "key-conflict").send({
        device_id: "DEV-10001", sender_id: "WH-001", receiver_id: "AG-030"
      });
    const second = await request(app).post("/api/transfer")
      .set("Idempotency-Key", "key-conflict").send({
        device_id: "DEV-10002", sender_id: "WH-001", receiver_id: "AG-030"
      });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/different request/);
  });

  test("does not update local inventory when external API fails", async () => {
    sendTransfer.mockRejectedValueOnce(Object.assign(new Error("External platform unavailable"), {
      statusCode: 503, attempts: 3
    }));

    const response = await request(app).post("/api/transfer")
      .set("Idempotency-Key", "failure-key")
      .send({ device_id: "DEV-10003", sender_id: "AG-002", receiver_id: "AG-050" });

    expect(response.status).toBe(503);
    expect(response.body.attempts).toBe(3);
  });
});
