import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/utils/verifyAuth";


export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid result id" }, { status: 400 });
  }
  const result = await prisma.testResult.findUnique({
    where: { id },
    include: { review: true },
  });
  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
