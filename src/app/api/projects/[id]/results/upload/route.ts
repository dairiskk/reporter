import { parsePlaywrightJson } from "@/utils/parsePlaywrightJson";
import { verifyAuth } from "@/utils/verifyAuth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";


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
  console.log(`[DEBUG] Created ReportFile: id=${reportFile.id}, name=${reportFile.name}, projectId=${reportFile.projectId}`);
  // Parse and insert test results, associating with reportFileId
  const results = parsePlaywrightJson(json, projectId).map(r => ({ ...r, reportFileId: reportFile.id }));
  await prisma.testResult.createMany({ data: results });
  return NextResponse.json({ success: true });
}

// GET: List all uploaded report files for a project
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  // Print all reportFile names for the project before filtering
  const allFiles = await prisma.reportFile.findMany({ where: { projectId: Number(params.id) }, select: { id: true, name: true } });
  console.log("[DEBUG] All reportFile names for project:", allFiles.map(f => f.name));
    // Debug: print all headers and search params
    console.log("[DEBUG] Headers:", Object.fromEntries(req.headers.entries()));
    const { searchParams } = new URL(req.url);
    console.log("[DEBUG] Search params:", Object.fromEntries(searchParams.entries()));
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = Number(params.id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  // Already declared above for debug logging
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const name = searchParams.get("name") || "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

    // Debug logs
    console.log("[DEBUG] Received name param:", name);
  const where: any = { projectId };
  if (name) {
    where.name = { contains: name, mode: "insensitive" };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
    console.log("[DEBUG] Constructed where clause:", JSON.stringify(where));

  try {
    const total = await prisma.reportFile.count({ where });
    const files = await prisma.reportFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return NextResponse.json({ files, total, page, pageSize });
  } catch (e) {
    return NextResponse.json({ files: [], total: 0, page, pageSize });
  }
}
