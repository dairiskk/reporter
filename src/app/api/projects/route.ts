import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
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
  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing project name" }, { status: 400 });
  }
  const project = await prisma.project.create({ data: { name } });
  return NextResponse.json({ id: project.id, name: project.name });
}
