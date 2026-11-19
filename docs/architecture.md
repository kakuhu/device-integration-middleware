# Architecture overview

```text
                +------------------+
                |      Client      |
                +--------+---------+
                         |
                  POST /api/transfer
                  Idempotency-Key
                         |
                +--------v---------+
                | Transfer         |
                | Controller       |
                +--------+---------+
                         |
                +--------v---------+
                | Idempotency      |
                | Service          |
                +--------+---------+
                         |
                +--------v---------+
                | Device Service   |
                +--------+---------+
                         |
                 Axios + retry policy
                         |
                +--------v---------+
                | Mock External    |
                | API              |
                +--------+---------+
                         |
                  accepted response
                         |
                +--------v---------+
                | Update in-memory |
                | inventory        |
                +--------+---------+
                         |
             +-----------+-----------+
             |                       |
    +--------v---------+   +---------v--------+
    | Transaction      |   | JSON API         |
    | Logger           |   | response         |
    +------------------+   +------------------+
```

All persistence in this sample is in-memory. The mock external API is local to this demo.
