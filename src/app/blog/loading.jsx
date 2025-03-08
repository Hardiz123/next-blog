import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.title}></div>
      <div className={styles.posts}>
        {/* Render multiple skeleton posts */}
        {Array.from({ length: 3 }, (_, i) => (
          <div className={styles.post} key={i}>
            <div className={styles.imageContainer}></div>
            <div className={styles.textContainer}>
              <div className={styles.postTitle}></div>
              <div className={styles.postDesc}></div>
              <div className={styles.postDetails}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 