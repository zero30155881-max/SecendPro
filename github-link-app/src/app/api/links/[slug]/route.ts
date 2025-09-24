import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const link = await db.link.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Increment click count
    await db.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { title, description, url, tags, isPublic } = body;

    const existingLink = await db.link.findUnique({
      where: { slug },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    const updatedLink = await db.link.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(url && { url }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const existingLink = await db.link.findUnique({
      where: { slug },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    await db.link.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}