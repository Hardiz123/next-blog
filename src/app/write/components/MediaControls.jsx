import { FaImage, FaLink, FaPlus, FaTimes } from 'react-icons/fa';
import styles from '../styles/MediaControls.module.css';

const MediaControls = ({
  showMenu,
  setShowMenu,
  onImageClick,
  onUrlClick
}) => {
  return (
    <div className={styles.mediaControls}>
      <button 
        className={`${styles.addButton} ${showMenu ? styles.active : ""}`} 
        onClick={() => setShowMenu(!showMenu)}
      >
        {showMenu ? <FaTimes /> : <FaPlus />}
        <span className={styles.buttonLabel}>Add Media</span>
      </button>
      
      {showMenu && (
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