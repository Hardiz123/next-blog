import { useRef, useState } from 'react';
import Image from 'next/image';
import { FaCamera, FaTrash, FaSpinner } from 'react-icons/fa';
import styles from '../styles/CoverPhoto.module.css';
import toast from 'react-hot-toast';

const CoverPhoto = ({
  coverPhotoUrl,
  setCoverPhotoUrl
}) => {
  const coverPhotoRef = useRef(null);
  const [isCoverPhotoUploading, setIsCoverPhotoUploading] = useState(false);
  const [coverPhotoProgress, setCoverPhotoProgress] = useState(0);
  const [coverPhotoError, setCoverPhotoError] = useState('');

  const handleCoverPhotoSelect = async (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setCoverPhotoError('Only image files are supported');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCoverPhotoError('Image size should be less than 5MB');
      return;
    }
    
    setIsCoverPhotoUploading(true);
    setCoverPhotoError('');
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setCoverPhotoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      // For demo purposes, we're just using a timeout to simulate upload
      // In a real app, you would use a proper upload function
      setTimeout(() => {
        // Create a local URL for the image
        const reader = new FileReader();
        reader.onload = (e) => {
          setCoverPhotoUrl(e.target.result);
          setIsCoverPhotoUploading(false);
          clearInterval(interval);
          setCoverPhotoProgress(100);
          toast.success('Cover photo uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }, 2000);
    } catch (error) {
      setCoverPhotoError('Error uploading cover photo. Please try again.');
      setIsCoverPhotoUploading(false);
      clearInterval(interval);
      toast.error('Failed to upload cover photo. Please try again.');
    }
  };

  const handleRemoveCoverPhoto = () => {
    setCoverPhotoUrl('');
    toast.success('Cover photo removed successfully');
  };

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
              onChange={(e) => handleCoverPhotoSelect(e.target.files[0])}
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
              onClick={handleRemoveCoverPhoto}
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