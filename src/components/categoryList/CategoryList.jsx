import React from "react";
import styles from "./categoryList.module.css";
import Link from "next/link";
import Image from "next/image";
import { createApiUrl } from "@/utils/apiUtils";

const getData = async () => {
  try {
    // Use the utility function to create the API URL with leading slash
    const url = createApiUrl('/api/categories');
    
    const res = await fetch(url, {
      cache: "no-store",
    });
    

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return empty array to prevent breaking the UI
    return [];
  }
};

const CategoryList = async () => {
  try {
    const data = await getData();
    
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Popular Categories</h1>
        <div className={styles.categories}>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((item) => (
              <Link
                href={`/blog?cat=${item.slug}`}
                className={`${styles.category} ${styles[item.slug]}`}
                key={item._id}
              >
                {item.img && (
                  <Image
                    src={item.img}
                    alt=""
                    width={32}
                    height={32}
                    className={styles.image}
                  />
                )}
                {item.title}
              </Link>
            ))
          ) : (
            <p>No categories available at the moment.</p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading categories:", error);
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Popular Categories</h1>
        <div className={styles.categories}>
          <p>Failed to load categories. Please try again later.</p>
        </div>
      </div>
    );
  }
};

export default CategoryList;
