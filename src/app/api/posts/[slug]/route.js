import prisma from "@/utils/connect";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/utils/auth";

// Debug mode - set to true to enable detailed logs
const DEBUG = true;

/**
 * Helper function to log debug messages
 */
function debugLog(...messages) {
  if (DEBUG) {
    console.log(`[POST-API ${new Date().toISOString()}]`, ...messages);
  }
}

// GET a single post by slug
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
  
  debugLog(`GET /api/posts/${slug} - User: ${userEmail || 'anonymous'}`);

  try {
    // Increment the views count
    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        likes: {
          select: {
            id: true,
            userEmail: true
          }
        },
      },
    });
    
    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Calculate likes count
    const likesCount = post.likes.length;
    
    // Build an array of emails who liked the post
    const likedBy = post.likes.map(like => like.userEmail);
    
    // Default is not liked
    let isLiked = false;
    
    // Check if the current user has liked the post
    if (userEmail) {
      // Check if the user's email is in the likedBy array
      isLiked = likedBy.includes(userEmail);
    }
    
    debugLog(`Post ${slug} has ${likesCount} likes from: ${likedBy.length > 0 ? likedBy.join(', ') : 'no one'}`);
    debugLog(`User ${userEmail || 'anonymous'} has ${isLiked ? 'liked' : 'not liked'} post ${slug}`);

    // Remove the likes array to reduce payload size while keeping the useful data
    const { likes, ...postWithoutLikes } = post;

    // Add likesCount, isLiked, and likedBy properties
    const postWithLikesInfo = {
      ...postWithoutLikes,
      likesCount,
      isLiked,
      likedBy,
    };

    return NextResponse.json(postWithLikesInfo);
  } catch (error) {
    debugLog(`Error fetching post ${slug}:`, error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

// DELETE a post by slug
export const DELETE = async (req, { params }) => {
  const { slug } = params;
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
      { message: "You must be logged in to delete a post" },
      { status: 401 }
    );
  }

  try {
    // Check if post exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the post
    if (post.userEmail !== userEmail) {
      return NextResponse.json(
        { message: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Delete all comments related to the post
    await prisma.comment.deleteMany({
      where: { postSlug: slug },
    });

    // Delete all likes related to the post
    await prisma.like.deleteMany({
      where: { postId: post.id },
    });

    // Delete the post
    await prisma.post.delete({
      where: { slug },
    });

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
