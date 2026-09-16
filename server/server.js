const express = require("express");
const cors = require("cors");
const { db, getPool, getSettlements } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/pools", (req, res) => {
  const { name, budget } = req.body;
  if (!name?.trim() || !Number.isFinite(Number(budget)) || Number(budget) <= 0) {
    return res.status(400).json({ error: "Valid pool name and positive budget are required." });
  }

  const result = db.prepare("INSERT INTO pools (name, budget) VALUES (?, ?)").run(
    name.trim(),
    Number(budget)
  );

  res.status(201).json(getPool(result.lastInsertRowid));
});

app.get("/api/pools/:id", (req, res) => {
  const pool = getPool(Number(req.params.id));
  if (!pool) return res.status(404).json({ error: "Pool not found." });
  res.json(pool);
});

app.post("/api/pools/:id/members", (req, res) => {
  const poolId = Number(req.params.id);
  const { name } = req.body;
  if (!getPool(poolId)) return res.status(404).json({ error: "Pool not found." });
  if (!name?.trim()) return res.status(400).json({ error: "Member name is required." });

  const result = db.prepare(
    "INSERT INTO members (pool_id, name) VALUES (?, ?)"
  ).run(poolId, name.trim());

  res.status(201).json(getPool(poolId));
});

app.delete("/api/members/:id", (req, res) => {
  const memberId = Number(req.params.id);
  const member = db.prepare("SELECT pool_id FROM members WHERE id = ?").get(memberId);
  if (!member) return res.status(404).json({ error: "Member not found." });

  db.prepare("DELETE FROM members WHERE id = ?").run(memberId);
  res.json(getPool(member.pool_id));
});

app.post("/api/members/:id/payments", (req, res) => {
  const memberId = Number(req.params.id);
  const amount = Number(req.body.amount);
  const member = db.prepare("SELECT pool_id FROM members WHERE id = ?").get(memberId);

  if (!member) return res.status(404).json({ error: "Member not found." });
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Payment must be a positive number." });
  }

  db.prepare("INSERT INTO payments (member_id, amount) VALUES (?, ?)").run(
    memberId,
    amount
  );

  res.status(201).json(getPool(member.pool_id));
});

app.get("/api/pools/:id/settlements", (req, res) => {
  const settlements = getSettlements(Number(req.params.id));
  if (!settlements) return res.status(404).json({ error: "Pool not found." });
  res.json({ settlements });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gift Pool API running on port ${PORT}`);
});