import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

let token = "";
let projectId = 0;

describe("Projects API", () => {
  it("should login and get token", async () => {
    // Register a user and login
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
    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    token = data.token;
  });

  it("should create a new project", async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Test Project" }),
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.name).toBe("Test Project");
    projectId = data.id;
  });

  it("should list all projects", async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: any) => p.id === projectId)).toBe(true);
  });

  it("should delete the project", async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
