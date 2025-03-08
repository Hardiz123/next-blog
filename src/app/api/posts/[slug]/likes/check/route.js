import { NextResponse } from "next/server";
import prisma from "@/utils/connect";
import { getAuthSession } from "@/utils/auth";

// GET endpoint to check if the current user has liked a post
export const GET = async (req, { params }) => {
  const { slug } = params;
  
  // Get the authenticated user session
  const session = await getAuthSession();
  
  // Get user email from session
  let userEmail = null;
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else if (session?.user) {
    // For Google OAuth, email might be in a different location
    userEmail = session.user.email || session.user.emailAddresses?.[0]?.emailAddress;
  }
  
  if (!userEmail) {
    return NextResponse.json(
      { isLiked: false, message: "Not authenticated" },
      { status: 200 }
    );
  }
  
  
  try {
    // First, find the post by slug
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!post) {
      return NextResponse.json(
        { isLiked: false, message: "Post not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has liked the post
    const like = await prisma.like.findFirst({
      where: {
        postId: post.id,
        userEmail: userEmail
      }
    });
    
    const isLiked = !!like;
    
    return NextResponse.json({ isLiked }, { status: 200 });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { isLiked: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}; 