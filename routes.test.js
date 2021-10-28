process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require("./db");
const app = require("./app");

beforeAll(async function () {
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
        invoices (comp_code, amt, add_date) VALUES 
        ('appl', 100, 1231),
        ('msft', 50, 2019),
        ('ibm', 75, 2005),
        ('intl', 200, 2001)
        RETURNING *`);
  testInvoices = insert_invoices.rows;
  testCompanies = insert_companies.rows;
});

describe("GET /companies", () => {
  test("Gets a list of companies from db", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: testCompanies.map((company)=>{return {name:company.name, code:company.code} }),
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
  new_company = {name:'exxon', code:'exx', description:'oil giant'}
  test("create company", async function () {
    const response = await request(app).post(`/companies`).send(new_company);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: new_company
    });
  });
});

describe("DELETE /companies/:code", () => {
  test("create company", async function () {
    const response = await request(app).delete(`/companies/appl`)
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      status:'deleted'
    });
    let check = await db.query(`SELECT * FROM companies`)
    expect(check).not.toContain({ code: 'appl', name: 'apple', description: 'Creater of iphone' })
  });
});


afterAll(async function () {
  // close db connection
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
  await db.end();
});
