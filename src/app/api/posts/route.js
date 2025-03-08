import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);

  const page = searchParams.get("page") || "1";
  const cat = searchParams.get("cat");

  const POST_PER_PAGE = 2;

  const query = {
    take: POST_PER_PAGE,
    skip: POST_PER_PAGE * (parseInt(page) - 1),
    where: {
      ...(cat && { catSlug: cat }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  };

  try {
    const [posts, count] = await prisma.$transaction([
      prisma.post.findMany(query),
      prisma.post.count({ where: query.where }),
    ]);
    return NextResponse.json({ posts, count }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};










// CREATE A POST
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Not Authenticated!" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    
    // Check if a post with this slug already exists
    let { slug } = body;
    let existingPost = await prisma.post.findUnique({
      where: { slug },
    });
    
    // If slug exists, add a unique identifier
    if (existingPost) {
      // Find how many posts with similar slug exist
      const similarSlugs = await prisma.post.findMany({
        where: {
          slug: {
            startsWith: slug
          }
        },
        select: {
          slug: true
        }
      });
      
      // Add a number suffix (slug-1, slug-2, etc.)
      slug = `${slug}-${similarSlugs.length}`;
      
      // Double-check the new slug is unique
      existingPost = await prisma.post.findUnique({
        where: { slug },
      });
      
      // In the rare case it's still not unique, add a random string
      if (existingPost) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }
    
    const post = await prisma.post.create({
      data: { 
        ...body,
        slug, // Use the potentially modified slug
        userEmail: session.user.email 
      },
    });

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
