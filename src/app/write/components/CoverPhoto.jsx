import { useRef } from 'react';
import Image from 'next/image';
import { FaCamera, FaTrash, FaSpinner } from 'react-icons/fa';
import styles from '../styles/CoverPhoto.module.css';

const CoverPhoto = ({
  coverPhotoUrl,
  isCoverPhotoUploading,
  coverPhotoProgress,
  coverPhotoError,
  onCoverPhotoSelect,
  onRemoveCoverPhoto
}) => {
  const coverPhotoRef = useRef(null);

  return (
    <div className={styles.coverPhotoSection}>
      <h3 className={styles.sectionTitle}>Cover Photo</h3>
      <div className={styles.coverPhotoContainer}>
        {!coverPhotoUrl ? (
          <div className={styles.coverPhotoUpload}>
            <input
              ref={coverPhotoRef}
              type="file"
              id="coverPhoto"
              accept="image/*"
              onChange={(e) => onCoverPhotoSelect(e.target.files[0])}
              style={{ display: "none" }}
            />
            <button 
              className={styles.coverPhotoButton}
              onClick={() => coverPhotoRef.current?.click()}
            >
              <FaCamera />
              <span>Add Cover Photo</span>
            </button>
            <p className={styles.coverPhotoHint}>
              Add a high-quality image to make your post stand out
            </p>
          </div>
        ) : (
          <div className={styles.coverPhotoPreview}>
            <Image 
              src={coverPhotoUrl} 
              alt="Cover photo" 
              width={1200} 
              height={600} 
              className={styles.coverImage}
            />
            <button 
              className={styles.removeCoverButton}
              onClick={onRemoveCoverPhoto}
              title="Remove cover photo"
            >
              <FaTrash />
            </button>
          </div>
        )}
        
        {isCoverPhotoUploading && (
          <div className={styles.coverPhotoProgress}>
            <FaSpinner className={styles.spinner} />
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${coverPhotoProgress}%` }}
                ></div>
              </div>
              <span className={styles.progressText}>{coverPhotoProgress}%</span>
            </div>
          </div>
        )}
        
        {coverPhotoError && (
          <p className={styles.errorText}>{coverPhotoError}</p>
        )}
      </div>
    </div>
  );
};

export default CoverPhoto; 