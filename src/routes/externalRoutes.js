const express = require("express");
const { receiveTransfer } = require("../controllers/externalController");

const router = express.Router();
router.post("/transfer", receiveTransfer);

module.exports = router;
