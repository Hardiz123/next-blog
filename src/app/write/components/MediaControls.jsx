import { FaImage, FaLink, FaPlus, FaTimes } from 'react-icons/fa';
import styles from '../styles/MediaControls.module.css';

const MediaControls = ({
  showMediaMenu,
  onImageClick,
  onUrlClick,
  onRecentClick
}) => {
  return (
    <div className={styles.mediaControls}>
      <button 
        className={`${styles.addButton} ${showMediaMenu ? styles.active : ""}`} 
        onClick={onRecentClick}
      >
        {showMediaMenu ? <FaTimes /> : <FaPlus />}
        <span className={styles.buttonLabel}>Add Media</span>
      </button>
      
      {showMediaMenu && (
        <div className={styles.addMenu}>
          <button 
            className={styles.mediaButton} 
            onClick={onImageClick}
            title="Upload Image"
          >
            <FaImage />
            <span>Image</span>
          </button>
          
          <button 
            className={styles.mediaButton} 
            onClick={onUrlClick}
            title="Add Link"
          >
            <FaLink />
            <span>Link</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaControls; 