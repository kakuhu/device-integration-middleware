# Manual verification checklist

- [ ] `npm install` completes successfully.
- [ ] `npm run dev` starts the API on port 5000.
- [ ] `GET http://localhost:5000/api/health` returns healthy.
- [ ] Successful transfer: set `DEMO_EXTERNAL_SCENARIO=success`, restart, transfer `DEV-10001`.
- [ ] Temporary failure: set `DEMO_EXTERNAL_SCENARIO=temporary_failure`, restart, transfer a fresh available device. Logs should show two retries then success.
- [ ] Permanent failure: set `DEMO_EXTERNAL_SCENARIO=permanent_failure`, restart, transfer a fresh available device. It should stop after three attempts.
- [ ] Client error: set `DEMO_EXTERNAL_SCENARIO=client_error`, restart, transfer a fresh available device. It should fail after one attempt.
- [ ] `GET /api/transactions` returns the transfer attempt records.
- [ ] Repeating an identical request with the same `Idempotency-Key` returns `idempotent_replay: true`.
- [ ] Reusing an idempotency key with different request data returns HTTP 409.
- [ ] `npm test` passes.
