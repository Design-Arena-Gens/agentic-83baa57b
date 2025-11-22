import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const guardId = Number(params.id);
  const data = await request.json();
  const { name, password } = data;

  if (!name && !password) {
    return NextResponse.json(
      { error: "No updates provided" },
      { status: 400 }
    );
  }

  const payload: { name?: string; passwordHash?: string } = {};
  if (name) payload.name = name;
  if (password) payload.passwordHash = await bcrypt.hash(password, 10);

  const guard = await prisma.user.update({
    where: { id: guardId },
    data: payload,
    select: { id: true, name: true, username: true, createdAt: true }
  });
  return NextResponse.json(guard);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (!session) return error;

  const guardId = Number(params.id);
  await prisma.patrol.deleteMany({ where: { guardId } });
  await prisma.user.delete({ where: { id: guardId } });
  return NextResponse.json({ success: true });
}
