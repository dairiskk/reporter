import { parsePlaywrightJson } from "@/utils/parsePlaywrightJson";
import { verifyAuth } from "@/utils/verifyAuth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST: Upload a new report file and its test results
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = Number(params.id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  const formData = await req.formData();
  const file = formData.get("file");
  const name = formData.get("name")?.toString() || (typeof file !== "string" && file ? file.name : "Untitled Report");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }
  // Create a new ReportFile record
  const reportFile = await prisma.reportFile.create({
    data: {
      name,
      projectId,
    },
  });
  // Parse and insert test results, associating with reportFileId
  const results = parsePlaywrightJson(json, projectId).map(r => ({ ...r, reportFileId: reportFile.id }));
  await prisma.testResult.createMany({ data: results });
  return NextResponse.json({ success: true });
}

// GET: List all uploaded report files for a project
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = Number(params.id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  const files = await prisma.reportFile.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });
  return NextResponse.json(files);
}
