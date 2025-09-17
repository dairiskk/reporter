import { describe, it, expect } from "vitest";
import fetch from "node-fetch";
import reportJson from "./playwright-report.json";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;

describe("Playwright Report Upload API", () => {
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
      body: JSON.stringify({ name: "Playwright Report Project" }),
    });
    const pdata = await pres.json() as any;
    projectId = pdata.id;
  });

  it("should upload a real Playwright report JSON", async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/results/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(reportJson),
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.inserted).toBeGreaterThan(0);
  });
});
