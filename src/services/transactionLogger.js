const transactions = [];

function recordTransaction(details) {
  const entry = {
    transaction_log_id: `LOG-${Date.now()}-${transactions.length + 1}`,
    timestamp: new Date().toISOString(),
    ...details
  };
  transactions.unshift(entry);
  console.log("[TRANSACTION LOG]", JSON.stringify(entry));
  return entry;
}

function getTransactions() {
  return transactions.map(item => ({ ...item }));
}

module.exports = { recordTransaction, getTransactions };
