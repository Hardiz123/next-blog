import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.textContainer}>
          <div className={styles.title}></div>
          <div className={styles.user}>
            <div className={styles.userImageContainer}></div>
            <div className={styles.userTextContainer}>
              <div className={styles.username}></div>
              <div className={styles.date}></div>
            </div>
          </div>
        </div>
        <div className={styles.imageContainer}></div>
      </div>
      <div className={styles.content}>
        <div className={styles.post}>
          <div className={styles.description}></div>
        </div>
        <div className={styles.sidebar}></div>
      </div>
    </div>
  );
} 