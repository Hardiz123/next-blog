"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";
import { useRouter, usePathname } from "next/navigation";
import { createApiUrl } from "@/utils/apiUtils";

const isBrowser = typeof window !== 'undefined';

const CardListClient = ({ 
  initialPosts, 
  count, 
  page, 
  cat,
  hasPrev,
  hasNext,
  postPerPage
}) => {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    if (!isBrowser) return; // Skip on server-side
    
    setLoading(true);
    try {
      // Use the utility function to create the API URL
      const url = createApiUrl('/api/posts', { page, cat });
      
      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }

      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Don't update state on error to keep existing posts
    } finally {
      setLoading(false);
    }
  }, [page, cat]);

  // Refetch data when component becomes visible again
  useEffect(() => {
    let timeoutId;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/') {
        // Add a small delay to ensure the page is fully visible
        timeoutId = setTimeout(() => {
          fetchPosts();
        }, 300);
      }
    };

    // Refetch when the user navigates back to the page
    window.addEventListener('focus', fetchPosts);
    
    // Refetch when the document becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refetch periodically if the page is visible (every 30 seconds)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && pathname === '/') {
        fetchPosts();
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', fetchPosts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, page, cat, fetchPosts]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Recent Posts
        {loading && <span className={styles.refreshing}> (Refreshing...)</span>}
      </h1>
      <div className={styles.posts}>
        {posts?.map((item) => (
          <Card item={item} key={item._id} />
        ))}
      </div>
      <Pagination page={page} hasPrev={hasPrev} hasNext={hasNext} />
    </div>
  );
};

export default CardListClient; 