import { useState, useCallback } from 'react';
import { uploadFile, deleteFile } from '../utils/firebase';
import toast from 'react-hot-toast';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);

  const handleUpload = useCallback(async (file) => {
    if (!file) return null;

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      const { url, fileName } = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Add to recent uploads
      setRecentUploads(prev => [
        { url, fileName },
        ...prev.slice(0, 4) // Keep last 5 uploads
      ]);

      setIsUploading(false);
      toast.success('Image uploaded successfully!');
      return url; // Return just the URL
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Error uploading image. Please try again.');
      setIsUploading(false);
      toast.error('Upload failed. Please try again.');
      return null;
    }
  }, []);

  const handleDelete = useCallback(async (fileName) => {
    if (!fileName) return false;

    try {
      await deleteFile(fileName);
      
      // Remove from recent uploads
      setRecentUploads(prev => prev.filter(item => item.fileName !== fileName));
      
      toast.success('Image deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image. Please try again.');
      return false;
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadError,
    recentUploads,
    handleUpload,
    handleDelete
  };
}; 