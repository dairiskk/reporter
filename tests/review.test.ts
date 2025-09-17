import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;
let resultId = 0;
let reviewId = 0;

const reviewReason = "ENV_ISSUE";

describe("Review API", () => {
  it("should login, create project, and upload result", async () => {
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
      body: JSON.stringify({ name: "Review Project" }),
    });
    const pdata = await pres.json() as any;
    projectId = pdata.id;
    // Upload result
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
                  title: "should fail",
                  projectName: "chrome",
                  results: [
                    {
                      status: "failed",
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
    await fetch(`${BASE_URL}/projects/${projectId}/results/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sampleJson),
    });
    // Get resultId
    const resList = await fetch(`${BASE_URL}/projects/${projectId}/results?status=failed`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await resList.json() as any;
    resultId = listData[0].id;
  });

  it("should add a review to a failed result", async () => {
    // Get userId from token (decode JWT)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const qaId = payload.userId;
    const res = await fetch(`${BASE_URL}/results/${resultId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reviewReason, comments: "Investigated", qaId }),
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
    expect(data.comments).toBe("Investigated");
    expect(data.reviewedAt).toBeDefined();
  });
});
