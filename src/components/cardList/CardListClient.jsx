"use client";

import React, { useState, useEffect } from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";
import { useRouter, usePathname } from "next/navigation";

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
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts?page=${page}&cat=${cat || ""}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await res.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [pathname, page, cat]);

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