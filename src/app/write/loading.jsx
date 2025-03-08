import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.titleInput}></div>
      <div className={styles.select}></div>
      <div className={styles.editor}>
        <div className={styles.toolbar}></div>
        <div className={styles.textArea}></div>
      </div>
      <div className={styles.publish}></div>
    </div>
  );
} 