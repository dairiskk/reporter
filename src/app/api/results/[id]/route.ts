import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
