const { getTransactions } = require("../services/transactionLogger");

function listTransactions(_req, res) {
  return res.status(200).json({
    success: true,
    count: getTransactions().length,
    transactions: getTransactions()
  });
}

module.exports = { listTransactions };
