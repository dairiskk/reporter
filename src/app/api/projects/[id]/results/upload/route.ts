import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/utils/verifyAuth";
import { parsePlaywrightJson } from "@/utils/parsePlaywrightJson";



const prisma = new PrismaClient();

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
  // Remove reviews first to avoid FK constraint, then results
  await prisma.review.deleteMany({ where: { testResult: { projectId } } });
  await prisma.testResult.deleteMany({ where: { projectId } });
  const results = parsePlaywrightJson(json, projectId);
  const inserted = await prisma.testResult.createMany({ data: results });
    return NextResponse.json({ success: true });
}
