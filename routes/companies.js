const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const companies = await db.query(`SELECT code,name FROM companies`);
    return res.json({ companies: companies.rows });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.get("/:code", async (req, res, next) => {
  const comp_code = req.params.code;
  try {
    const company = await db.query(
      `SELECT code,name,description FROM companies WHERE code=$1`,
      [comp_code]
    );
    const invoices = await db.query(
      `SELECT * FROM invoices WHERE comp_code=$1`,
      [comp_code]
    );
    company.rows[0]["invoices"] = [...invoices.rows];
    return res.json({ company: company.rows[0] });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.post("/", async (req, res, next) => {
  const { code, name, description } = req.body;
  try {
    const company = await db.query(
      `INSERT INTO companies (code,name,description)  VALUES ($1,$2,$3) RETURNING *`,
      [code, name, description]
    );
    return res.json({company: company.rows[0]});
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.put("/:code", async (req, res, next) => {
  const { name, description } = req.body;
  try {
    const company = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING * `,
      [name, description, req.params.code]
    );
    return res.json({ company: company.rows[0] });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const company = await db.query(`DELETE FROM companies WHERE code=$1`, [
      req.params.code,
    ]);
    return res.json({ status: "deleted" });
  } catch (e) {
    return res.json({ message: "invalid request" });
  }
});

module.exports = router;
