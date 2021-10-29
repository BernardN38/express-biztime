const express = require("express");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

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
  slugifyString(comp_code);
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
  let { code, name, description } = req.body;
  slugifyString(code, name, description);
  try {
    const company = await db.query(
      `INSERT INTO companies (code,name,description)  VALUES ($1,$2,$3) RETURNING *`,
      [code, name, description]
    );
    return res.json({ company: company.rows[0] });
  } catch (e) {
    return res.json({ message: "no data found" });
  }
});

router.put("/:code", async (req, res, next) => {
  const { name, description } = req.body;
  slugifyString(name, description)
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
      slugifyString(req.params.code),
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
module.exports = router;
