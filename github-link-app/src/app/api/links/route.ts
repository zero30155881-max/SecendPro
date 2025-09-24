import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug, isValidUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: search.split(' ') } },
      ];
    }

    if (tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { clicks: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const [links, total] = await Promise.all([
      db.link.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.link.count({ where }),
    ]);

    return NextResponse.json({
      links,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, url, tags = [], userId } = body;

    // Validation
    if (!title || !description || !url) {
      return NextResponse.json(
        { error: 'Title, description, and URL are required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(title);
    let existingLink = await db.link.findUnique({ where: { slug } });

    let counter = 1;
    while (existingLink) {
      slug = `${generateSlug(title)}-${counter}`;
      existingLink = await db.link.findUnique({ where: { slug } });
      counter++;
    }

    // Create link
    const link = await db.link.create({
      data: {
        title,
        description,
        url,
        slug,
        tags,
        isPublic: true,
        userId,
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

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}