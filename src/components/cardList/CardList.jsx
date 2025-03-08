import React from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";
import CardListClient from "./CardListClient";
import { createApiUrl } from "@/utils/apiUtils";

const getData = async (page, cat) => {
  try {
    // Use the utility function to create the API URL
    const url = createApiUrl('/api/posts', { page, cat });
    
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    // Return empty data to prevent breaking the UI
    return { posts: [], count: 0 };
  }
};

const CardList = async ({ page, cat }) => {
  const { posts, count } = await getData(page, cat);

  const POST_PER_PAGE = 2;

  const hasPrev = POST_PER_PAGE * (page - 1) > 0;
  const hasNext = POST_PER_PAGE * (page - 1) + POST_PER_PAGE < count;

  return (
    <CardListClient 
      initialPosts={posts} 
      count={count} 
      page={page} 
      cat={cat}
      hasPrev={hasPrev}
      hasNext={hasNext}
      postPerPage={POST_PER_PAGE}
    />
  );
};

export default CardList;
