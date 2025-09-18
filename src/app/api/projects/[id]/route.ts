import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/utils/verifyAuth";



export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Project not found or already deleted" }, { status: 404 });
  }
}
