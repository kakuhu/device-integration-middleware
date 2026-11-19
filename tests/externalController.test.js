const request = require("supertest");
const app = require("../src/app");

describe("Mock external API", () => {
  test("accepts a valid successful transfer request", async () => {
    const response = await request(app)
      .post("/api/external/transfer")
      .set("x-demo-scenario", "success")
      .send({ device_id: "TEST-EXT-1", sender_id: "WH-001", receiver_id: "AG-001" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.transaction_id).toBeDefined();
  });

  test("rejects invalid payloads", async () => {
    const response = await request(app).post("/api/external/transfer").send({ device_id: "TEST" });
    expect(response.status).toBe(400);
  });
});
