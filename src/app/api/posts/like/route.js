import { NextResponse } from "next/server";
import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { broadcastUpdate } from "@/app/api/sse/route";

// Debug mode - set to true to enable detailed logs
const DEBUG = true;

/**
 * Helper function to log debug messages
 */
function debugLog(...messages) {
  if (DEBUG) {
    console.log(`[LIKE-API ${new Date().toISOString()}]`, ...messages);
  }
}

// POST request to like a post
export async function POST(req) {
  try {
    const session = await getAuthSession();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const body = await req.json();
    const { slug } = body;
    
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }
    
    debugLog(`Processing like request for slug: ${slug} by user: ${session.user.email}`);
    
    // Find the post by slug
    const post = await prisma.post.findUnique({
      where: { slug },
    });
    
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    // Check if the user has already liked the post
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: post.id,
        userEmail: session.user.email,
      },
    });
    
    let liked = false;
    let action = "unlike";
    
    if (existingLike) {
      // User has already liked the post, so unlike it
      debugLog(`User ${session.user.email} is unliking post: ${slug}`);
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      // User has not liked the post, so like it
      debugLog(`User ${session.user.email} is liking post: ${slug} (postId: ${post.id})`);
      await prisma.like.create({
        data: {
          postId: post.id,
          userEmail: session.user.email,
        },
      });
      liked = true;
      action = "like";
    }
    
    // Get updated likes count
    const likesCount = await prisma.like.count({
      where: { postId: post.id },
    });
    
    debugLog(`Updated likes count for ${slug}: ${likesCount}`);
    
    // Prepare broadcast message
    const broadcastMessage = {
      type: "post_liked",
      likesCount,
      action,
      likedBy: session.user.email,
      postId: post.id,
      postTitle: post.title,
      slug,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast debug info
    debugLog(`Broadcasting update for ${slug}: action=${action}, count=${likesCount}`);
    
    try {
      // Small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Broadcast to the specific post slug
      const broadcastResult = await broadcastUpdate(broadcastMessage, slug);
      debugLog(`Broadcast attempt result: ${JSON.stringify(broadcastResult)}`);
    } catch (error) {
      debugLog(`Broadcast error: ${error.message}`);
      // Continue processing even if broadcast fails
    }
    
    // Return detailed response
    return NextResponse.json({
      liked,
      likesCount,
      action,
      slug,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    debugLog(`Error processing like: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 