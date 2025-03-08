"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./postActions.module.css";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaHeart, FaRegHeart, FaTrash, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import Modal from "@/components/modal/Modal";

// Enable debug mode for verbose logging
const DEBUG = true;

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Helper for debug logging
 */
function debugLog(...messages) {
  if (DEBUG) {
    console.log(`[PostActions]`, ...messages);
  }
}

export default function PostActions({ post }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get user email from session
  const userEmail = session?.user?.email;
  
  // Get initial likes data from post prop
  const initialLikes = post?.likesCount || 0;
  const initialIsLiked = post?.isLiked === true;
  
  debugLog("Rendering PostActions:", { 
    postId: post?.id,
    slug: post?.slug,
    initialLikes,
    initialIsLiked,
    isLikedRaw: post?.isLiked,
    userEmail
  });

  // State for likes and isLiked
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sseStatus, setSSEStatus] = useState("connecting");
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Refs for managing SSE connection
  const sseRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Update state when post prop changes or session status changes
  useEffect(() => {
    if (post?.likesCount !== undefined) {
      setLikes(post.likesCount);
    }
    if (post?.isLiked !== undefined) {
      setIsLiked(post.isLiked === true);
    }
    
    // Log when state is updated
    debugLog("Updated state from props:", {
      likesCount: post?.likesCount,
      isLiked: post?.isLiked,
      userEmail,
      status
    });

    // Set initial loading to false after first update
    setInitialLoading(false);
    
  }, [post?.likesCount, post?.isLiked, userEmail, status]);

  // If session changes, try to refresh the post data to update like status
  useEffect(() => {
    if (status === 'authenticated' && post?.slug) {
      debugLog("Session authenticated, refreshing post data");
      setInitialLoading(true);
      refreshData()
        .finally(() => setInitialLoading(false));
    }
  }, [status, post?.slug]);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        debugLog("Closing SSE connection on unmount");
        sseRef.current.close();
        sseRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // Connect to SSE for this post
  const connectSSE = useCallback(() => {
    if (!post?.slug) {
      debugLog("No slug available, cannot connect to SSE");
      return;
    }

    // Close existing connection if any
    if (sseRef.current) {
      try {
        debugLog("Closing existing SSE connection before creating a new one");
        sseRef.current.close();
      } catch (err) {
        debugLog("Error closing existing SSE connection:", err);
      }
      sseRef.current = null;
    }

    const sseURL = `/api/sse?slug=${post.slug}`;
    debugLog(`Connecting to SSE at ${sseURL}`);
    
    try {
      const eventSource = new EventSource(sseURL);
      sseRef.current = eventSource;
      
      // Connection opened
      eventSource.onopen = () => {
        debugLog("SSE connection opened");
        setSSEStatus("connected");
      };
      
      // Handle messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          debugLog("SSE message received:", data);
          
          // Handle specific message types
          if (data.type === "connection") {
            debugLog("SSE connection established:", data);
            setSSEStatus("connected");
          } else if (data.type === "post_liked") {
            debugLog("Received post_liked update:", data);
            
            // Update likes count from server
            setLikes(data.likesCount);
            
            // If the current user is the one who liked/unliked, we already updated the UI
            // Otherwise, if the email matches, update isLiked state
            if (data.likedBy === userEmail) {
              setIsLiked(data.action === "like");
            }
            
            // Show a toast notification if someone else liked/unliked
            if (data.likedBy !== userEmail) {
              const action = data.action === "like" ? "liked" : "unliked";
              const userLabel = data.likedBy?.split('@')[0] || "Someone";
              toast(`${userLabel} ${action} this post`, {
                icon: data.action === "like" ? "❤️" : "💔",
              });
            }
          }
        } catch (err) {
          debugLog("Error processing SSE message:", err, event.data);
        }
      };
      
      // Handle errors
      eventSource.onerror = (err) => {
        debugLog("SSE connection error:", err);
        setSSEStatus("error");
        
        // Close the errored connection
        eventSource.close();
        sseRef.current = null;
        
        // Try to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          debugLog("Attempting to reconnect SSE");
          connectSSE();
        }, 5000); // 5 second delay before reconnect attempt
      };
      
      return eventSource;
    } catch (error) {
      debugLog("Error setting up SSE connection:", error);
      setSSEStatus("error");
      return null;
    }
  }, [post?.slug, userEmail]);
  
  // Initialize SSE when the component mounts and we have a slug
  useEffect(() => {
    if (post?.slug) {
      connectSSE();
    }
    
    // Clean up function
    return () => {
      if (sseRef.current) {
        debugLog(`Closing SSE connection for ${post?.slug}`);
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [post?.slug, connectSSE]);

  // Manual refresh function to get latest data if SSE fails
  const refreshData = useCallback(async () => {
    if (!post?.slug) return;
    
    try {
      debugLog("Manually refreshing post data");
      const res = await fetch(`/api/posts/${post.slug}`, {
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        debugLog("Refreshed post data:", data);
        
        setLikes(data.likesCount || 0);
        // Make sure to check the correct property name
        setIsLiked(data.isLiked === true);
      }
    } catch (err) {
      debugLog("Error refreshing post data:", err);
    }
  }, [post?.slug]);

  // Handle like button click
  const handleLike = async () => {
    if (!session) {
      // Use window.location for a more direct redirect
      debugLog("User not authenticated, redirecting to login page");
      window.location.href = '/login';
      return;
    }

    if (loading) return;
    
    setLoading(true);
    
    // Optimistic UI update
    const prevIsLiked = isLiked;
    const prevLikes = likes;
    
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: post.slug,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update like");
      }
      
      debugLog("Like response:", data);
      
      // Toast notification
      if (data.action === "like") {
        toast.success("Post liked!");
      } else {
        toast("Post unliked");
      }
      
      // Update state with server data
      setLikes(data.likesCount);
      setIsLiked(data.liked);
      
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(prevIsLiked);
      setLikes(prevLikes);
      
      debugLog("Error liking post:", error);
      toast.error("Failed to update like. Please try again.");
      
      // Try to refresh data from server
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  // Open the delete confirmation modal
  const openDeleteModal = () => {
    if (!isBrowser) return; // Skip on server-side
    
    if (!session || session.user.email !== post.user.email) {
      toast.error("You can only delete your own posts");
      return;
    }
    
    setIsDeleteModalOpen(true);
  };

  // Handle delete button click (for post author)
  const handleDelete = async () => {
    if (!isBrowser) return; // Skip on server-side
    
    if (deleteLoading) return;
    
    setDeleteLoading(true);

    try {
      // Use the utility function to create the API URL
      const url = `/api/posts/${post.slug}`;
      
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        // Close the modal
        setIsDeleteModalOpen(false);
        toast.success("Post deleted successfully!");
        router.push("/");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Error deleting post: " + error.message);
      debugLog("Error deleting post:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Determine if current user is the author
  const isAuthor = session?.user?.email === post?.user?.email;

  // Loading spinner component
  const LoadingSpinner = () => (
    <FaSpinner className={styles.spinner} />
  );

  return (
    <div className={styles.container}>
      <div className={styles.buttonsContainer}>
        {initialLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
            <span>Loading likes...</span>
          </div>
        ) : (
          <>
            <button 
              className={`${styles.likeButton} ${isLiked ? styles.liked : ""} ${!session ? styles.loginRequired : ""}`}
              onClick={handleLike}
              disabled={loading}
              aria-label={!session ? "Login to like post" : (isLiked ? "Unlike post" : "Like post")}
              title={!session ? "Login to like this post" : (isLiked ? "Unlike this post" : "Like this post")}
            >
              {loading ? <LoadingSpinner /> : (isLiked ? <FaHeart /> : <FaRegHeart />)}
              {!session && <span className={styles.loginText}>Login to like</span>}
            </button>
            
            <span className={styles.likesCount} aria-live="polite">
              {loading ? <LoadingSpinner /> : `${likes} ${likes === 1 ? "like" : "likes"}`}
            </span>
            
            {isAuthor && (
              <button 
                className={styles.deleteButton} 
                onClick={openDeleteModal}
                disabled={deleteLoading}
                aria-label="Delete post"
              >
                {deleteLoading ? <LoadingSpinner /> : <FaTrash />}
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Post"
        onConfirm={handleDelete}
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      >
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
        <p className={styles.warningText}>
          This will permanently delete the post and all associated comments.
        </p>
      </Modal>
      
      {DEBUG && (
        <div className={`${styles.sseStatus} ${styles[sseStatus]}`}>
          {sseStatus === "connected" && "SSE Connected ✓"}
          {sseStatus === "connecting" && "SSE Connecting..."}
          {sseStatus === "error" && "SSE Error - Auto-reconnecting"}
        </div>
      )}
    </div>
  );
} 