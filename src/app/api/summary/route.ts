import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/summary?projectIds[]=...&reportFileIds[]=...&startDate=...&endDate=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectIds = searchParams.getAll("projectIds[]").map(id => Number(id)).filter(id => !isNaN(id));
  const reportFileIds = searchParams.getAll("reportFileIds[]").map(id => Number(id)).filter(id => !isNaN(id));
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build query filters
  const where: Record<string, unknown> = {};
  if (projectIds.length > 0) where.projectId = { in: projectIds };
  if (reportFileIds.length > 0) where.reportFileId = { in: reportFileIds };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
  }

  // Aggregate test results
  const stats = await prisma.testResult.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  // Return summary
  return NextResponse.json({
    summary: stats.map((s: { status: string; _count: { status: number } }) => ({ status: s.status, count: s._count.status }))
  });
}
