import { useState } from 'react';
import { FaYoutube, FaLink, FaVideo } from 'react-icons/fa';
import styles from '../styles/UrlInput.module.css';

const UrlInput = ({
  urlType,
  onInsert,
  onCancel
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onInsert(urlInput);
    setUrlInput('');
  };

  const getPlaceholder = () => {
    switch (urlType) {
      case 'youtube':
        return 'Paste YouTube URL (e.g., https://www.youtube.com/watch?v=abcdef123)';
      case 'link':
        return 'Paste external link URL';
      case 'video':
        return 'Paste video URL (.mp4, .webm, etc.)';
      default:
        return 'Enter URL';
    }
  };

  const getIcon = () => {
    switch (urlType) {
      case 'youtube':
        return <FaYoutube />;
      case 'link':
        return <FaLink />;
      case 'video':
        return <FaVideo />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (urlType) {
      case 'youtube':
        return 'Add YouTube Video';
      case 'link':
        return 'Add External Link';
      case 'video':
        return 'Add Video URL';
      default:
        return 'Add URL';
    }
  };

  return (
    <div className={styles.urlInputContainer}>
      <div className={styles.urlTypeIndicator}>
        {getIcon()}
        <span>{getTitle()}</span>
      </div>
      <div className={styles.urlInputWrapper}>
        <input
          type="text"
          className={styles.urlInput}
          placeholder={getPlaceholder()}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className={styles.urlButtons}>
          <button 
            className={styles.insertButton} 
            onClick={handleSubmit}
            disabled={!urlInput.trim()}
          >
            Insert
          </button>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrlInput; 