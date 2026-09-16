import React, { useEffect, useMemo, useState } from "react";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})}`;

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function CreatePool({ onCreated }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("6000");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const pool = await api("/api/pools", {
        method: "POST",
        body: JSON.stringify({ name, budget: Number(budget) })
      });
      onCreated(pool.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup">
      <div className="brand">🎁 Gift Pool</div>
      <h1>Collect together.<br /><span>Settle simply.</span></h1>
      <p className="muted">Track equal shares, partial payments, overpayments and the final settlement.</p>
      <form onSubmit={submit} className="card form-card">
        <label>Pool name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Manager Farewell" required />
        <label>Gift budget</label>
        <div className="money-input"><span>₹</span><input type="number" min="1" value={budget} onChange={e => setBudget(e.target.value)} required /></div>
        <button disabled={loading}>{loading ? "Creating..." : "Create Gift Pool"}</button>
      </form>
    </div>
  );
}

function Dashboard({ pool, refresh }) {
  const [memberName, setMemberName] = useState("");
  const [paying, setPaying] = useState(null);
  const [amount, setAmount] = useState("");
  const [settlements, setSettlements] = useState([]);
  const [showSettlement, setShowSettlement] = useState(false);

  const remainingToCollect = Math.max(0, pool.remaining);
  const settled = pool.members.filter(m => Math.abs(m.balance) < 0.005).length;

  async function addMember(e) {
    e.preventDefault();
    if (!memberName.trim()) return;
    try {
      await api(`/api/pools/${pool.id}/members`, {
        method: "POST",
        body: JSON.stringify({ name: memberName })
      });
      setMemberName("");
      refresh();
    } catch (e) { alert(e.message); }
  }

  async function addPayment(id) {
    try {
      await api(`/api/members/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) })
      });
      setPaying(null);
      setAmount("");
      refresh();
    } catch (e) { alert(e.message); }
  }

  async function removeMember(id) {
    if (!confirm("Remove this participant and their payments?")) return;
    try {
      await api(`/api/members/${id}`, { method: "DELETE" });
      refresh();
    } catch (e) { alert(e.message); }
  }

  async function openSettlement() {
    try {
      const data = await api(`/api/pools/${pool.id}/settlements`);
      setSettlements(data.settlements);
      setShowSettlement(true);
    } catch (e) { alert(e.message); }
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <div className="eyebrow">GIFT POOL</div>
          <h1>{pool.name}</h1>
        </div>
        <div className="budget-pill">Budget <strong>{money(pool.budget)}</strong></div>
      </header>

      <section className="stats">
        <div className="stat card"><span>Target budget</span><strong>{money(pool.budget)}</strong></div>
        <div className="stat card"><span>Collected</span><strong>{money(pool.collected)}</strong></div>
        <div className="stat card"><span>Left to collect</span><strong>{money(remainingToCollect)}</strong></div>
        <div className="stat card"><span>Equal share</span><strong>{money(pool.share)}</strong></div>
      </section>

      <section className="card progress-card">
        <div className="progress-head"><span>Collection progress</span><strong>{pool.progress.toFixed(0)}%</strong></div>
        <div className="progress"><div style={{ width: `${pool.progress}%` }} /></div>
        <p className="muted">{money(pool.collected)} collected of {money(pool.budget)}</p>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h2>Participants</h2>
            <p className="muted">{pool.members.length} people · {settled} settled</p>
          </div>
        </div>

        <form className="add-member" onSubmit={addMember}>
          <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Add participant name" />
          <button>Add member</button>
        </form>

        {pool.members.length === 0 ? (
          <div className="empty">Add the people who are chipping in.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Share</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {pool.members.map(m => {
                  const owe = m.balance < -0.005;
                  const receive = m.balance > 0.005;
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.name}</strong></td>
                      <td>{money(m.share)}</td>
                      <td>{money(m.paid)}</td>
                      <td className={owe ? "negative" : receive ? "positive" : ""}>
                        {owe ? `-${money(-m.balance)}` : receive ? `+${money(m.balance)}` : money(0)}
                      </td>
                      <td><span className={`badge ${owe ? "owe" : receive ? "receive" : "done"}`}>
                        {owe ? "Owes" : receive ? "Gets back" : "Settled"}
                      </span></td>
                      <td className="actions">
                        {paying === m.id ? (
                          <div className="pay-form">
                            <input autoFocus type="number" min="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                            <button type="button" onClick={() => addPayment(m.id)}>Save</button>
                            <button type="button" className="ghost" onClick={() => setPaying(null)}>×</button>
                          </div>
                        ) : (
                          <button className="small" onClick={() => setPaying(m.id)}>+ Payment</button>
                        )}
                        <button className="delete" onClick={() => removeMember(m.id)}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="settle-cta">
        <div>
          <h2>Ready to settle up?</h2>
          <p>Generate the simplest list of who should pay whom.</p>
        </div>
        <button onClick={openSettlement}>View settlement →</button>
      </section>

      {showSettlement && (
        <div className="modal-backdrop" onClick={() => setShowSettlement(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="eyebrow">FINAL STEP</div><h2>Settlement plan</h2></div>
              <button className="close" onClick={() => setShowSettlement(false)}>×</button>
            </div>
            {settlements.length === 0 ? (
              <div className="success">✓ Everyone is settled. No transfers needed.</div>
            ) : (
              <div className="settlement-list">
                {settlements.map((s, i) => (
                  <div className="transfer" key={i}>
                    <span className="person">{s.from}</span>
                    <span className="arrow">→</span>
                    <span className="person">{s.to}</span>
                    <strong>{money(s.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
            <p className="muted footnote">Each transfer moves money from someone who is below their fair share to someone who paid above theirs.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [poolId, setPoolId] = useState(() => localStorage.getItem("giftPoolId"));
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(!!poolId);

  async function refresh() {
    if (!poolId) return;
    try { setPool(await api(`/api/pools/${poolId}`)); }
    catch { localStorage.removeItem("giftPoolId"); setPoolId(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [poolId]);

  function created(id) {
    localStorage.setItem("giftPoolId", id);
    setPoolId(String(id));
  }

  if (!poolId) return <CreatePool onCreated={created} />;
  if (loading || !pool) return <div className="loading">Loading your gift pool...</div>;
  return <Dashboard pool={pool} refresh={refresh} />;
}