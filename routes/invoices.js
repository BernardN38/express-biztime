const express = require("express");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const invoices = await db.query(`SELECT * FROM invoices`);
    return res.json(invoices.rows);
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
    return res.json({ invoice: invoice.rows[0] });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.post("/", async (req, res, next) => {
  const { comp_code, amt } = req.body;
  slugifyString(comp_code, amt);
  try {
    const invoice = await db.query(
      `INSERT INTO invoices (comp_code, amt)  VALUES ($1,$2) RETURNING *`,
      [comp_code, amt]
    );
    return res.json(invoice.rows[0]);
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.put("/:id", async (req, res, next) => {
  let { amt, paid } = req.body;
  let id = req.params.id;
  let invoice;
  if (paid == 't') {
    invoice = await payInvoice(amt, paid, id);
  }
  if (paid == 'f') {
    invoice = await updatedInvoice(amt,id)
  }
  return res.json({invoice});
});

router.delete("/:id", async (req, res, next) => {
  try {
    const invoice = await db.query(`DELETE FROM invoices WHERE id=$1`, [
      slugifyString(req.params.id),
    ]);
    return res.json({ status: "deleted" });
  } catch (e) {
    return res.json({ message: "invalid request" });
  }
});

function slugifyString(...args) {
  for (let text of args) {
    let new_text = slugify(`${text}`, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    return new_text;
  }
}
async function payInvoice(amt, paid, id) {
  let paidInvoice = await db.query(
    `UPDATE invoices SET amt=$1, paid=$2 WHERE id=$3 RETURNING *`,
    [amt, paid, id]
  );
  return paidInvoice.rows;
}

async function updatedInvoice(amt, id){
  let updatedInvoice =  await db.query(
    "UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *",
    [amt, id])
  return updatedInvoice.rows;
}
module.exports = router;
