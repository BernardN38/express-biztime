process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require("./db");
const app = require("./app");

beforeEach(async function () {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
  let insert_companies = await db.query(`
      INSERT INTO
        companies (name,code, description) VALUES 
        ('apple', 'appl', 'Creater of iphone'),
        ('microsoft', 'msft', 'Maker of windows 11'),
        ('international business machine', 'ibm', 'makes business machines'),
        ('intel', 'intl', 'maker of cpu proccessors')
        RETURNING *`);
  let insert_invoices = await db.query(`
      INSERT INTO
        invoices (id, comp_code, amt, add_date) VALUES 
        (1,'appl', 100, 1231),
        (2,'msft', 50, 2019),
        (3,'ibm', 75, 2005),
        (4, 'intl', 200, 2001)
        RETURNING *`);
  testInvoices = insert_invoices.rows;
  testCompanies = insert_companies.rows;
});

describe("GET /companies", () => {
  test("Gets a list of companies from db", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: testCompanies.map((company) => {
        return { name: company.name, code: company.code };
      }),
    });
  });
});

describe("GET /companies/:code", () => {
  test("Gets one specific company", async function () {
    const response = await request(app).get(`/companies/appl`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: { ...testCompanies[0], invoices: [testInvoices[0]] },
    });
  });
});

describe("POST /companies/", () => {
  new_company = { name: "exxon", code: "exx", description: "oil giant" };
  test("create company", async function () {
    const response = await request(app).post(`/companies`).send(new_company);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: new_company,
    });
  });
});

describe("DELETE /companies/:code", () => {
  test("create company", async function () {
    const response = await request(app).delete(`/companies/appl`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      status: "deleted",
    });
    let check = await db.query(`SELECT * FROM companies`);
    expect(check).not.toContain({
      code: "appl",
      name: "apple",
      description: "Creater of iphone",
    });
  });
});

describe("GET /invoices", () => {
  test("Gets a list of invoices", async function () {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(testInvoices);
  });
});

describe("GET /invoices/:id", () => {
  test("Gets one invoice", async function () {
    const response = await request(app).get("/invoices/2");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ invoice: testInvoices[1] });
  });
});

describe("POST /invoices", () => {
  new_invoice = { comp_code: "intl", amt: 135 };
  test("create invoice", async function () {
    const response = await request(app).post(`/invoices`).send(new_invoice);
    let { rows } = await db.query(`SELECT * FROM invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body.comp_code).toEqual("intl");
    expect(response.body.amt).toEqual(135);
    expect(rows[rows.length - 1].comp_code).toEqual(new_invoice.comp_code);
    expect(rows[rows.length - 1].amt).toEqual(new_invoice.amt);
  });
});

describe("DELETE /invoice/:id", () => {
  test("delete invoice", async function () {
    const check1 = await db.query(`SELECT * FROM invoices`);
    const response = await request(app).delete(`/invoices/1`);
    const check2 = await db.query(`SELECT * FROM invoices`);
    expect(response.statusCode).toEqual(200);
    expect(check1.rows.length).toBeGreaterThan(check2.rows.length);
    expect(response.body).toEqual({
      status: "deleted",
    });
    expect(check2.rows[0]).not.toEqual({
      id: 1,
      comp_code: "appl",
      amt: 100,
      paid: false,
      add_date: 1231,
      paid_date: null,
    });
  });
});

afterAll(async function () {
  // close db connection
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
  await db.end();
});
