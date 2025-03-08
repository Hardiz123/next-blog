import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";
import { broadcastUpdate } from "@/app/api/sse/route";

// Debug mode
const DEBUG = true;

// Helper function for debug logging
function debugLog(...messages) {
  if (DEBUG) {
    console.log(`[COMMENT-DELETE-API ${new Date().toISOString()}]`, ...messages);
  }
}

/**
 * DELETE a comment by ID
 * Only the comment owner can delete their comment
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: "Comment ID is required" }, 
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json(
        { message: "Not authenticated" }, 
        { status: 401 }
      );
    }
    
    debugLog(`Attempting to delete comment ID: ${id} by user: ${session.user.email}`);
    
    // Find the comment first to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id },
    });
    
    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the user is the owner of the comment
    if (comment.userEmail !== session.user.email) {
      debugLog(`Unauthorized deletion attempt: ${session.user.email} tried to delete comment owned by ${comment.userEmail}`);
      return NextResponse.json(
        { message: "You can only delete your own comments" }, 
        { status: 403 }
      );
    }
    
    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });
    
    debugLog(`Comment deleted: ${id}`);
    
    // Broadcast comment deletion
    try {
      // Prepare broadcast message
      const broadcastMessage = {
        type: "comment_deleted",
        commentId: id,
        postSlug: comment.postSlug,
        userEmail: session.user.email,
        userName: session.user.name,
        timestamp: new Date().toISOString()
      };
      
      debugLog(`Broadcasting comment deletion for post ${comment.postSlug}`);
      
      // Add small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Broadcast to the post slug
      const result = await broadcastUpdate(broadcastMessage, comment.postSlug);
      debugLog(`Broadcast result: ${JSON.stringify(result)}`);
    } catch (error) {
      debugLog(`Error broadcasting comment deletion: ${error.message}`);
      // Continue even if broadcast fails
    }
    
    return NextResponse.json({ 
      message: "Comment deleted successfully",
      commentId: id
    }, { status: 200 });
    
  } catch (error) {
    debugLog(`Error deleting comment: ${error.message}`);
    return NextResponse.json(
      { message: "Something went wrong" }, 
      { status: 500 }
    );
  }
} 