import { describe, it, expect } from "vitest";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;

const reportNames = [
  "dawdawdawd",
  "fsefsefsefsefsefs",
  "dawdawdaw",
  "dadwadawd"
];

describe("ReportFile search API", () => {
  it("should login and create a project", async () => {
    const email = `test_${Math.random().toString(36).substring(2, 10)}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test123" }),
    });
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test123" }),
    });
  const data = await res.json() as any;
    token = data.token;
    // Create project
    const pres = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "ReportFile Search Project" }),
    });
  const pdata = await pres.json() as any;
    projectId = pdata.id;
  });

  it("should create multiple report files", async () => {
  // Use real Playwright report JSON from file
  const reportJson = fs.readFileSync("./tests/playwright-report.json", "utf-8");
    for (const name of reportNames) {
      const form = new FormData();
      form.append("file", Buffer.from(reportJson), "report.json");
      form.append("name", name);
      const res = await fetch(`${BASE_URL}/projects/${projectId}/results/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form as any,
      });
      expect(res.status).toBe(200);
    }
  });

  it("should search report files by partial name", async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/results/upload?name=d`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  const data = await res.json() as any;
    expect(Array.isArray(data.files)).toBe(true);
    // Should match all names containing 'd'
    const matchedNames = data.files.map(f => f.name);
    expect(matchedNames).toContain("dawdawdawd");
    expect(matchedNames).toContain("dawdawdaw");
    expect(matchedNames).toContain("dadwadawd");
    expect(matchedNames).not.toContain("fsefsefsefsefsefs");
    expect(data.files.length).toBe(3);
  });
});
