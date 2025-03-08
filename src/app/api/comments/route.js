import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";
import { broadcastUpdate } from "@/app/api/sse/route";

// Debug mode
const DEBUG = true;

// Helper function for debug logging
function debugLog(...messages) {
  if (DEBUG) {
    console.log(`[COMMENTS-API ${new Date().toISOString()}]`, ...messages);
  }
}

// GET ALL COMMENTS OF A POST
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  debugLog(`Fetching comments for ${postSlug || "all posts"}`);

  try {
    const comments = await prisma.comment.findMany({
      where: {
        ...(postSlug && { postSlug }),
      },
      include: { user: true },
      orderBy: {
        createdAt: "desc"
      }
    });

    debugLog(`Found ${comments.length} comments`);
    return new NextResponse(JSON.stringify(comments), { status: 200 });
  } catch (err) {
    debugLog(`Error fetching comments: ${err.message}`);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }), 
      { status: 500 }
    );
  }
};

// CREATE A COMMENT
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }), 
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { desc, postSlug } = body;

    if (!desc || !desc.trim()) {
      return new NextResponse(
        JSON.stringify({ message: "Comment text is required" }), 
        { status: 400 }
      );
    }

    if (!postSlug) {
      return new NextResponse(
        JSON.stringify({ message: "Post slug is required" }), 
        { status: 400 }
      );
    }

    debugLog(`Creating comment for post ${postSlug} by ${session.user.email}`);

    // Create the comment
    const comment = await prisma.comment.create({
      data: { 
        desc, 
        postSlug,
        userEmail: session.user.email 
      },
      include: {
        user: true
      }
    });

    // Prepare broadcast message
    const broadcastMessage = {
      type: "comment_added",
      comment: {
        id: comment.id,
        desc: comment.desc,
        postSlug: comment.postSlug,
        createdAt: comment.createdAt
      },
      userEmail: session.user.email,
      userName: session.user.name,
      timestamp: new Date().toISOString()
    };

    debugLog(`Broadcasting comment notification for ${postSlug}`);

    try {
      // Add small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Broadcast to the specific post slug
      const broadcastResult = await broadcastUpdate(broadcastMessage, postSlug);
      debugLog(`Broadcast result: ${JSON.stringify(broadcastResult)}`);
    } catch (error) {
      debugLog(`Error during broadcast: ${error.message}`);
      // Continue even if broadcast fails - client will still get the response
    }

    return new NextResponse(JSON.stringify(comment), { status: 200 });
  } catch (err) {
    debugLog(`Error creating comment: ${err.message}`);
    console.error(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }), 
      { status: 500 }
    );
  }
};
