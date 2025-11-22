import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const guards = await prisma.user.findMany({
    where: { role: "GUARD" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true
    }
  });
  return NextResponse.json(guards);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const data = await request.json();
  const { name, username, password } = data;
  if (!name || !username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 400 }
    );
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const guard = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role: "GUARD"
    },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true
    }
  });
  return NextResponse.json(guard, { status: 201 });
}
