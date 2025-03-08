import Image from 'next/image';
import { FaTrash, FaUpload } from 'react-icons/fa';
import styles from '../styles/RecentUploads.module.css';

const RecentUploads = ({
  uploads = [],
  onInsert,
  onDelete
}) => {
  if (!uploads || uploads.length === 0) {
    return null;
  }

  return (
    <div className={styles.recentUploadsContainer}>
      <h3 className={styles.title}>Recent Uploads</h3>
      <div className={styles.uploadsList}>
        {uploads.map((item, index) => (
          <div key={index} className={styles.uploadItem}>
            <div className={styles.uploadPreview}>
              <Image 
                src={item.url} 
                alt={`Upload ${index+1}`} 
                width={100} 
                height={70}
                objectFit="cover" 
              />
              <div className={styles.uploadActions}>
                <button 
                  className={`${styles.actionButton} ${styles.insertButton}`}
                  onClick={() => onInsert(item.url)}
                  title="Insert again"
                >
                  <FaUpload />
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => onDelete(item.fileName)}
                  title="Delete image"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentUploads; 