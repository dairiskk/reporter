import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

describe("Auth API", () => {
  it("should register a new user", async () => {
    const randomEmail = `test_${Math.random().toString(36).substring(2, 10)}@example.com`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: randomEmail, password: "test123" }),
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.email).toBe(randomEmail);
  });

  it("should login with correct credentials", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "test123" }),
    });
  const data = await res.json() as any;
  expect(res.status).toBe(200);
  expect(data.token).toBeDefined();
  });
});
