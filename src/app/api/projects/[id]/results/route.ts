import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
      review: true,
    },
    orderBy: { timestamp: "desc" },
  });

  const data = results.map(r => ({
    id: r.id,
    testName: r.testName,
    status: r.status,
    timestamp: r.timestamp,
    reviewed: !!r.review,
  }));
  return NextResponse.json(data);
}
