import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/review-reasons?projectIds[]=...&reportFileIds[]=...&startDate=...&endDate=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectIds = searchParams.getAll("projectIds[]").map(id => Number(id)).filter(id => !isNaN(id));
  const reportFileIds = searchParams.getAll("reportFileIds[]").map(id => Number(id)).filter(id => !isNaN(id));
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build query filters
  const where: Record<string, unknown> = {};
  if (projectIds.length > 0) {
    where.testResult = { projectId: { in: projectIds } };
  }
  if (reportFileIds.length > 0) {
    where.testResult = { ...(where.testResult || {}), reportFileId: { in: reportFileIds } };
  }
  if (startDate || endDate) {
    where.reviewedAt = {};
    if (startDate) (where.reviewedAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.reviewedAt as Record<string, unknown>).lte = new Date(endDate);
  }

  // Aggregate review reasons
  const reasons = await prisma.review.groupBy({
    by: ["reason"],
    where,
    _count: { reason: true },
  });

  // Return summary
  return NextResponse.json({
  reasons: reasons.map((r: { reason: string; _count: { reason: number } }) => ({ reason: r.reason, count: r._count.reason }))
  });
}
