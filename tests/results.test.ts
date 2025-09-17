import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;
let resultId = 0;

describe("Test Results API", () => {
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
      body: JSON.stringify({ name: "Results Project" }),
    });
    const pdata = await pres.json() as any;
    projectId = pdata.id;
  });

  it("should upload test results", async () => {
    const sampleJson = {
      suites: [
        {
          title: "Root Suite",
          specs: [
            {
              title: "Spec 1",
              file: "spec1.test.ts",
              tests: [
                {
                  title: "should pass",
                  projectName: "chrome",
                  results: [
                    {
                      status: "passed",
                      startTime: new Date().toISOString(),
                      duration: 123,
                      stdout: [{ text: "Test output" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const res = await fetch(`${BASE_URL}/projects/${projectId}/results/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sampleJson),
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.inserted).toBeGreaterThan(0);
  });

  it("should list test results", async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/results?status=all`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    resultId = data[0].id;
  });

  it("should get a single test result", async () => {
    const res = await fetch(`${BASE_URL}/results/${resultId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.id).toBe(resultId);
    expect(data.testName).toBeDefined();
    expect(data.status).toBeDefined();
  });
});
