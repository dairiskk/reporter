import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/utils/verifyAuth";

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = Number(params.id);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";

  const where: any = { projectId };
  if (status !== "all") {
    where.status = status;
  }

  const results = await prisma.testResult.findMany({
    where,
    select: {
      id: true,
      testName: true,
      status: true,
      timestamp: true,
      duration: true,
      review: {
        select: {
          reason: true,
          comments: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  const data = results.map(r => ({
    id: r.id,
    testName: r.testName,
    status: r.status,
    timestamp: r.timestamp,
    duration: r.duration,
    reviewed: !!r.review,
    review: r.review ? { reason: r.review.reason, comments: r.review.comments } : null,
  }));
  return NextResponse.json(data);
}
