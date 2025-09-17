import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/utils/verifyAuth";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const testResultId = Number(params.id);
  const { reason, comments, qaId } = await req.json();
  if (!testResultId || !reason || !qaId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    await prisma.review.create({
      data: {
        testResultId,
        reason,
        comments,
        qaId,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Review creation failed" }, { status: 400 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const testResultId = Number(params.id);
  if (!testResultId) {
    return NextResponse.json({ error: "Invalid result id" }, { status: 400 });
  }
  const review = await prisma.review.findUnique({
    where: { testResultId },
    select: {
      id: true,
      reason: true,
      comments: true,
      reviewedAt: true,
    },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  return NextResponse.json(review);
}
