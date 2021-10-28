const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const invoices = await db.query(`SELECT * FROM invoices`);
    return res.json(invoices.rows);
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [
      req.params.id,
    ]);
    return res.json({invoice: invoice.rows[0]});
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.post("/", async (req, res, next) => {
  const { comp_code, amt} = req.body;
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
  const { amt } = req.body;
  try {
    const invoice = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING * `,
      [amt, req.params.id]
    );
    return res.json({ invoice: invoice.rows[0] });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const invoice = await db.query(`DELETE FROM invoices WHERE id=$1`, [
      req.params.id,
    ]);
    return res.json({ status: "deleted" });
  } catch (e) {
    return res.json({ message: "invalid request" });
  }
});

module.exports = router;
