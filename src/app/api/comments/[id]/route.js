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
 * GET a comment by ID
 */
export const GET = async (req, { params }) => {
  const { id } = params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

/**
 * DELETE a comment by ID
 * Only the comment owner can delete their comment
 */
export const DELETE = async (req, { params }) => {
  const { id } = params;
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Not authenticated!" },
      { status: 401 }
    );
  }

  try {
    // Check if comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the comment
    if (comment.userEmail !== session.user.email) {
      return NextResponse.json(
        { message: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

// PATCH (update) a comment by ID
export const PATCH = async (req, { params }) => {
  const { id } = params;
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Not authenticated!" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { desc } = body;

    // Check if comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the comment
    if (comment.userEmail !== session.user.email) {
      return NextResponse.json(
        { message: "You can only update your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { desc },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}; 