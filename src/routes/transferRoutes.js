const express = require("express");
const { processTransfer } = require("../controllers/transferController");

const router = express.Router();
router.post("/transfer", processTransfer);

module.exports = router;
