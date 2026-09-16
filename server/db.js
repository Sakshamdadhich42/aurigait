const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "gift_pool.db"));
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget REAL NOT NULL CHECK (budget > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );
`);

function getPool(poolId) {
  const pool = db.prepare("SELECT * FROM pools WHERE id = ?").get(poolId);
  if (!pool) return null;

  const members = db.prepare(`
    SELECT m.id, m.name, COALESCE(SUM(p.amount), 0) AS paid
    FROM members m
    LEFT JOIN payments p ON p.member_id = m.id
    WHERE m.pool_id = ?
    GROUP BY m.id
    ORDER BY m.id
  `).all(poolId);

  const share = members.length ? pool.budget / members.length : 0;
  const enriched = members.map(m => ({
    ...m,
    paid: Number(m.paid),
    share,
    balance: Number(m.paid) - share
  }));

  const collected = enriched.reduce((sum, m) => sum + m.paid, 0);

  return {
    ...pool,
    budget: Number(pool.budget),
    collected,
    remaining: Math.max(0, Number(pool.budget) - collected),
    progress: Math.min(100, (collected / Number(pool.budget)) * 100),
    share,
    members: enriched
  };
}

function getSettlements(poolId) {
  const pool = getPool(poolId);
  if (!pool) return null;

  const debtors = pool.members
    .filter(m => m.balance < -0.005)
    .map(m => ({ name: m.name, amount: -m.balance }));

  const creditors = pool.members
    .filter(m => m.balance > 0.005)
    .map(m => ({ name: m.name, amount: m.balance }));

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);

    if (amount > 0.005) {
      settlements.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Number(amount.toFixed(2))
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount <= 0.005) i++;
    if (creditors[j].amount <= 0.005) j++;
  }

  return settlements;
}

module.exports = { db, getPool, getSettlements };