import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/utils/verifyAuth";


export async function GET(req: Request) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    include: {
      results: {
        where: { status: "failed" },
        select: { id: true },
      },
    },
  });
  const data = projects.map((p) => ({
    id: p.id,
    name: p.name,
    failedCount: p.results.length,
  }));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing project name" }, { status: 400 });
  }
  const project = await prisma.project.create({ data: { name } });
  return NextResponse.json({ id: project.id, name: project.name });
}
