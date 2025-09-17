import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parsePlaywrightJson } from "@/utils/parsePlaywrightJson";


const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  const json = await req.json();
  const results = parsePlaywrightJson(json, projectId);
  const inserted = await prisma.testResult.createMany({ data: results });
  return NextResponse.json({ inserted: inserted.count });
}
