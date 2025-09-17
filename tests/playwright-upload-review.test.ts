import { describe, it, expect } from "vitest";
import fetch from "node-fetch";
import reportJson from "./playwright-report.json";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;
let resultId = 0;

const reviewReason = "ENV_ISSUE";

describe("Playwright Report Upload & Review", () => {
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

  it("should list uploaded test results", async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/results?status=all`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    // Find a result with status 'passed' from the uploaded report
    const passedResult = data.find((r: any) => r.status === "passed");
    expect(passedResult).toBeDefined();
    resultId = passedResult.id;
  });

  it("should allow user to set review status for a result", async () => {
    // Get userId from token (decode JWT)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const qaId = payload.userId;
    const res = await fetch(`${BASE_URL}/results/${resultId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reviewReason, comments: "Looks good", qaId }),
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should get the review for the result", async () => {
    const res = await fetch(`${BASE_URL}/results/${resultId}/review`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.reason).toBe(reviewReason);
    expect(data.comments).toBe("Looks good");
    expect(data.reviewedAt).toBeDefined();
  });
});
