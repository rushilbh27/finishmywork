import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        university: true,
        major: true,
        year: true,
        location: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        _count: {
          select: {
            postedTasks: true,
            acceptedTasks: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count completed tasks
    const completedTasks = await prisma.task.count({
      where: {
        OR: [
          { posterId: userId, status: 'COMPLETED' },
          { accepterId: userId, status: 'COMPLETED' },
        ],
      },
    })
    
    return NextResponse.json({
      ...user,
      _count: {
        ...user._count,
        completedTasks,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
