import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/utils/verifyAuth";
import { parsePlaywrightJson } from "@/utils/parsePlaywrightJson";



const prisma = new PrismaClient();

export async function POST(req: Request, context: { params: { id: string } }) {
  const { params } = context;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = Number(params.id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  const json = await req.json();
  const results = parsePlaywrightJson(json, projectId);
  const inserted = await prisma.testResult.createMany({ data: results });
  return NextResponse.json({ inserted: inserted.count });
}
