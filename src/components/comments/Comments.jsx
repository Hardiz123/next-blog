"use client";

import Link from "next/link";
import styles from "./comments.module.css";
import Image from "next/image";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { FaPaperPlane, FaCommentDots, FaSpinner, FaTrash, FaEllipsisV } from "react-icons/fa";
import Modal from "@/components/modal/Modal";
import { createApiUrl, getBaseUrl } from "@/utils/apiUtils";

// Debug mode for detailed logging
const DEBUG = true;

// Helper function for logging
function debugLog(...messages) {
  if (DEBUG) {
    console.log("[Comments]", ...messages);
  }
}

const fetcher = async (url) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

const Comments = ({ postSlug }) => {
  const { status, data: session } = useSession();
  const textareaRef = useRef(null);
  const [sseStatus, setSSEStatus] = useState("disconnected");
  const sseRef = useRef(null);

  const { data, mutate, isLoading, error } = useSWR(
    createApiUrl(`/api/comments?postSlug=${postSlug}`),
    fetcher,
    {
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
      onSuccess: (data) => debugLog(`Successfully loaded ${data.length} comments`),
      onError: (err) => debugLog("Error loading comments:", err)
    }
  );

  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // Connect to SSE for comment updates
  useEffect(() => {
    if (!postSlug) return;

    const connectSSE = () => {
      if (sseRef.current) {
        sseRef.current.close();
      }

      debugLog(`Connecting to SSE for comments on ${postSlug}`);
      const eventSource = new EventSource(`/api/sse?slug=${postSlug}`);
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        debugLog("SSE connection opened for comments");
        setSSEStatus("connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          debugLog("SSE message received:", data);

          if (data.type === "comment_added") {
            debugLog("New comment notification received");
            
            // Refresh comments
            setIsMutating(true);
            mutate()
              .finally(() => setIsMutating(false));
            
            // Show notification if comment is from another user
            if (session?.user?.email !== data.userEmail) {
              const username = data.userName || data.userEmail.split('@')[0];
              toast(`${username} added a comment`, {
                icon: "💬",
              });
            }
          } else if (data.type === "comment_deleted") {
            debugLog("Comment deletion notification received");
            
            // Refresh comments
            setIsMutating(true);
            mutate()
              .finally(() => setIsMutating(false));
            
            // Show notification if comment is from another user
            if (session?.user?.email !== data.userEmail) {
              const username = data.userName || data.userEmail.split('@')[0];
              toast(`${username} deleted a comment`, {
                icon: "🗑️",
              });
            }
          }
        } catch (err) {
          debugLog("Error processing SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        debugLog("SSE connection error:", err);
        setSSEStatus("error");
        eventSource.close();
        
        // Try to reconnect after a delay
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (sseRef.current) {
        debugLog("Closing SSE connection");
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [postSlug, session?.user?.email, mutate]);

  // Manually refresh comments
  const refreshComments = () => {
    if (isMutating) return;
    
    setIsMutating(true);
    toast.promise(
      mutate(),
      {
        loading: 'Refreshing comments...',
        success: 'Comments refreshed!',
        error: 'Failed to refresh comments'
      }
    ).finally(() => setIsMutating(false));
  };

  const handleSubmit = async () => {
    if (!desc.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(createApiUrl("/api/comments"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          desc: desc.trim(), 
          postSlug 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }

      // Show success message
      toast.success("Comment published!");
      
      // Clear textarea
      setDesc("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      
      // Refresh comments list with loading indicator
      setIsMutating(true);
      await mutate();
      setIsMutating(false);
    } catch (error) {
      debugLog("Error submitting comment:", error);
      toast.error("Failed to publish comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !session) return;
    
    setIsDeletingComment(true);
    
    try {
      const response = await fetch(createApiUrl(`/api/comments/${commentToDelete.id}`), {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment");
      }
      
      // Show success message
      toast.success("Comment deleted!");
      
      // Close modal
      setIsDeleteModalOpen(false);
      setCommentToDelete(null);
      
      // Refresh comments list
      setIsMutating(true);
      await mutate();
      setIsMutating(false);
    } catch (error) {
      debugLog("Error deleting comment:", error);
      toast.error("Failed to delete comment. Please try again.");
    } finally {
      setIsDeletingComment(false);
    }
  };

  // Handle Ctrl+Enter to submit
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Check if the user can delete a comment
  const canDeleteComment = (comment) => {
    if (!session) return false;
    const isOwnComment = comment?.userEmail === session?.user?.email;
    return isOwnComment;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FaCommentDots className={styles.commentIcon} />
          Comments {data?.length > 0 && `(${data.length})`}
        </h1>
        
        {!isLoading && !isSubmitting && (
          <button 
            onClick={refreshComments}
            disabled={isMutating}
            className={styles.refreshButton}
            aria-label="Refresh comments"
          >
            {isMutating ? (
              <FaSpinner className={styles.spinner} />
            ) : (
              <span>Refresh</span>
            )}
          </button>
        )}
      </div>
      
      {status === "authenticated" ? (
        <div className={styles.write}>
          <textarea
            ref={textareaRef}
            placeholder="Write your comment here... (Ctrl+Enter to submit)"
            className={styles.input}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
          <button 
            className={styles.button} 
            onClick={handleSubmit}
            disabled={isSubmitting || !desc.trim()}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className={styles.spinner} />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaPaperPlane className={styles.sendIcon} />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className={styles.loginPrompt}>
          <Link href="/login" className={styles.loginLink}>Login to write a comment</Link>
        </div>
      )}
      
      <div className={styles.comments}>
        {isLoading ? (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <span>Loading comments...</span>
          </div>
        ) : error ? (
          <div className={styles.error}>
            Error loading comments. 
            <button onClick={() => mutate()} className={styles.retryButton}>
              Try again
            </button>
          </div>
        ) : isMutating ? (
          <div className={styles.mutating}>
            <FaSpinner className={styles.spinner} />
            <span>Updating comments...</span>
          </div>
        ) : data?.length === 0 ? (
          <div className={styles.noComments}>No comments yet. Be the first to comment!</div>
        ) : (
          data?.map((item) => (
            <div className={styles.comment} key={item.id}>
              <div className={styles.commentHeader}>
                <div className={styles.user}>
                  {item?.user?.image ? (
                    <Image
                      src={item.user.image}
                      alt={item.user.name || "user"}
                      width={50}
                      height={50}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(item.user.name || "User").charAt(0)}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <span className={styles.username}>{item.user.name}</span>
                    <span className={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {canDeleteComment(item) && (
                  <button 
                    className={styles.deleteCommentButton}
                    onClick={() => handleDeleteClick(item)}
                    aria-label="Delete comment"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <p className={styles.desc}>{item.desc}</p>
            </div>
          ))
        )}
      </div>
      
      {/* Delete Comment Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        title="Delete Comment"
        onConfirm={handleDeleteComment}
        confirmText={isDeletingComment ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      >
        <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
        {commentToDelete && (
          <div className={styles.commentPreview}>
            <p>&ldquo;{commentToDelete.desc.length > 100 
              ? commentToDelete.desc.substring(0, 100) + '...' 
              : commentToDelete.desc}&rdquo;</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Comments;
