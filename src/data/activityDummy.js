// SAMPLE DATA for the Activity page. The backend doesn't record stock history
// yet (the audit trail was dropped in migration V5), so the page is built on
// this generator. When the API exists, replace `loadActivity()` in
// pages/Activity.jsx with the real call and delete this file — the event shape
// below is the one the old history endpoint used (plus partId/partName).
//
//   { id, partId, partName, changeType, qtyBefore, qtyAfter, qtyChange, note, createdAt }
//
// changeType is one of ADD | SOLD | RECEIVED | ADJUSTMENT | RETURNED.

export const ACTIVITY_IS_SAMPLE = true;

const DAY = 86400000;

// Shown when the shop has no parts yet, so the page still has something to preview.
export const SAMPLE_PARTS = [
  { id: "sample-1", partName: "Brake Pad Set — Front", quantity: 8, minQuantity: 4 },
  { id: "sample-2", partName: "Engine Oil Filter", quantity: 20, minQuantity: 8 },
  { id: "sample-3", partName: "Clutch Plate", quantity: 5, minQuantity: 4 },
  { id: "sample-4", partName: "Headlight Assembly", quantity: 0, minQuantity: 3 },
  { id: "sample-5", partName: "Battery 12V 35Ah", quantity: 6, minQuantity: 5 },
  { id: "sample-6", partName: "Chain Sprocket Kit", quantity: 12, minQuantity: 5 },
];

const NOTES = {
  ADD: ["Part added to inventory"],
  SOLD: ["Counter sale", "Workshop job", "Walk-in customer", "", ""],
  RECEIVED: ["Supplier delivery", "Restock order", ""],
  ADJUSTMENT: ["Stock count correction", "Damaged, written off"],
  RETURNED: ["Customer return"],
};

// Same part id → same history on every render, so the page doesn't reshuffle.
function rngFor(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/**
 * Builds a believable history for each part that ends exactly at the part's
 * current quantity: events are generated newest → oldest, undoing each change,
 * and the chain finishes with the "added" event.
 */
export function buildSampleActivity(parts) {
  const now = Date.now();
  const out = [];

  for (const part of parts) {
    const rand = rngFor(String(part.id));
    const count = 3 + Math.floor(rand() * 6);
    const addedAt = now - (30 + rand() * 15) * DAY;
    const times = Array.from({ length: count }, () => addedAt + (0.04 + rand() * 0.96) * (now - addedAt - 3600000))
      .sort((a, b) => a - b);

    let after = Math.max(0, Number(part.quantity) || 0);
    const chain = [];
    for (let i = count - 1; i >= 0; i--) {
      const r = rand();
      let type = r < 0.55 ? "SOLD" : r < 0.8 ? "RECEIVED" : r < 0.9 ? "ADJUSTMENT" : "RETURNED";
      const mag = 1 + Math.floor(rand() * Math.max(2, Math.ceil((after + 3) * 0.5)));
      let change = type === "SOLD" ? -mag : type === "ADJUSTMENT" ? (rand() < 0.5 ? -1 : 1) * (1 + Math.floor(rand() * 2)) : mag;
      if (after - change < 0) {
        // Can't have started below zero — make it a sale instead.
        type = "SOLD";
        change = -mag;
      }
      const before = after - change;
      chain.push({
        id: `${part.id}-${i}`,
        partId: part.id,
        partName: part.partName,
        changeType: type,
        qtyBefore: before,
        qtyAfter: after,
        qtyChange: change,
        note: pick(rand, NOTES[type]),
        createdAt: new Date(times[i]).toISOString(),
      });
      after = before;
    }

    chain.push({
      id: `${part.id}-add`,
      partId: part.id,
      partName: part.partName,
      changeType: "ADD",
      qtyBefore: 0,
      qtyAfter: after,
      qtyChange: after,
      note: NOTES.ADD[0],
      createdAt: new Date(addedAt).toISOString(),
    });
    out.push(...chain);
  }

  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
