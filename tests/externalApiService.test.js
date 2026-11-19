jest.mock("axios");

const axios = require("axios");
const { sendTransfer } = require("../src/services/externalApiService");

describe("External API retry behaviour", () => {
  beforeEach(() => {
    axios.post.mockReset();
  });

  test("returns after the first successful external response", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, transaction_id: "EXT-OK" }
    });

    const result = await sendTransfer("DEV-X1", "WH-001", "AG-001");

    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test("retries server errors and succeeds when the service recovers", async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 503, data: { message: "Temporary outage" } }, message: "503" })
      .mockRejectedValueOnce({ response: { status: 503, data: { message: "Temporary outage" } }, message: "503" })
      .mockResolvedValueOnce({ data: { success: true, transaction_id: "EXT-RECOVERED" } });

    const result = await sendTransfer("DEV-X2", "WH-001", "AG-002");

    expect(result.transaction_id).toBe("EXT-RECOVERED");
    expect(axios.post).toHaveBeenCalledTimes(3);
  });

  test("does not retry a client error", async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Invalid request" } },
      message: "400"
    });

    await expect(sendTransfer("DEV-X3", "WH-001", "AG-003"))
      .rejects.toMatchObject({ statusCode: 400, attempts: 1 });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test("stops after the configured maximum attempts", async () => {
    axios.post.mockRejectedValue({
      response: { status: 503, data: { message: "Still unavailable" } },
      message: "503"
    });

    await expect(sendTransfer("DEV-X4", "WH-001", "AG-004"))
      .rejects.toMatchObject({ statusCode: 503, attempts: 3 });
    expect(axios.post).toHaveBeenCalledTimes(3);
  });
});
