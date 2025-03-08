"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaSun, FaMoon } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

import styles from "./styles/WritePage.module.css";
import CoverPhoto from "./components/CoverPhoto";
import MediaControls from "./components/MediaControls";
import UrlInput from "./components/UrlInput";
import RecentUploads from "./components/RecentUploads";
import CategorySelector from "./components/CategorySelector";
import TipTapEditor from "./components/TipTapEditor";

import { usePost } from "./hooks/usePost";
import { useMediaUpload } from "./hooks/useMediaUpload";
import { validateUrl } from "./utils/validation";

const WritePage = () => {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize custom hooks
  const { 
    title, setTitle, 
    content, setContent, 
    category, setCategory, 
    coverPhotoUrl, setCoverPhotoUrl, 
    isSubmitting, 
    handleSubmit,
    handleSaveAsDraft
  } = usePost();

  const {
    isUploading,
    uploadProgress,
    uploadError,
    recentUploads = [],
    handleUpload,
    handleDelete
  } = useMediaUpload();

  // Handle editor ready event
  const handleEditorReady = (editor) => {
    console.log('Editor is ready');
    setEditorLoaded(true);
    setEditorInstance(editor);
  };

  // Check for dark mode preference on mount
  useEffect(() => {
    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkModePreference);
    if (darkModePreference) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    console.log('File input change detected');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name);
      handleImageSelect(file);
    }
  };

  // Handle image selection
  const handleImageSelect = async (file) => {
    try {
      if (!file) {
        console.error('No file provided');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are supported');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const imageUrl = await handleUpload(file);
      
      if (imageUrl) {
        console.log('Image uploaded successfully:', imageUrl);
        
        // Insert image into editor
        if (window.tiptapEditor && window.tiptapEditor.isReady) {
          window.tiptapEditor.insertImage(imageUrl);
        } else {
          console.error('Editor is not ready for image insertion');
        }
        
        setShowMediaMenu(false);
      } else {
        console.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  // Handle URL submission
  const handleUrlSubmit = (url) => {
    console.log('URL submitted:', url);
    
    if (!url) {
      setUrlError('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setUrlError('Please enter a valid URL');
      return;
    }
    
    // Clear error
    setUrlError('');
    
    // Check if URL is an image
    const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
    
    if (isImage) {
      // Insert image into editor
      if (window.tiptapEditor && window.tiptapEditor.isReady) {
        window.tiptapEditor.insertImage(url);
        
        // Add to recent uploads
        setRecentUploads((prev) => [
          { id: Date.now(), url },
          ...(prev || []),
        ]);
        
        toast.success('Image inserted successfully!');
      } else {
        console.error('Editor is not ready for image insertion');
        toast.error('Editor not ready. Please try again.');
      }
    } else {
      // Insert link into editor
      if (window.tiptapEditor && window.tiptapEditor.isReady) {
        window.tiptapEditor.insertLink(url);
        toast.success('Link inserted successfully!');
      } else {
        console.error('Editor is not ready for link insertion');
        toast.error('Editor not ready. Please try again.');
      }
    }
    
    // Hide URL input
    setShowUrlInput(false);
  };

  // Handle recent upload insertion
  const handleInsertRecentUpload = (url) => {
    if (!url) {
      console.error('Cannot insert image: No URL provided');
      return;
    }
    
    if (!editorLoaded || !editorInstance) {
      console.error('Cannot insert image: Editor is not fully loaded');
      return;
    }
    
    // Use the window.addImage function exposed by TipTapEditor
    if (window.addImage) {
      window.addImage(url);
      toast.success('Image inserted successfully!');
    } else {
      toast.error('Editor not ready. Please try again.');
    }
  };

  // Toggle dark/light mode
  const toggleThemeMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <FaSpinner className={styles.spinner} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.editorHeader}>
        <input
          type="text"
          placeholder="Title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className={styles.headerButtons}>
          <button 
            className={styles.previewToggle} 
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "Edit mode" : "Preview mode"}
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button 
            className={styles.themeToggle} 
            onClick={toggleThemeMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
      
      <CoverPhoto 
        coverPhotoUrl={coverPhotoUrl} 
        setCoverPhotoUrl={setCoverPhotoUrl} 
      />
      
      <div className={styles.mediaSection}>
        <h2 className={styles.sectionTitle}>Content</h2>
        
        {!showPreview && (
          <>
            <MediaControls 
              onImageClick={() => {
                console.log('MediaControls onImageClick called');
                console.log('fileInputRef exists:', !!fileInputRef.current);
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  console.error('File input reference is not available');
                }
              }}
              onUrlClick={() => {
                console.log('MediaControls onUrlClick called');
                setShowUrlInput(true);
                setShowMediaMenu(false);
              }}
              showMenu={showMediaMenu}
              setShowMenu={setShowMediaMenu}
            />
            
            {showUrlInput && (
              <UrlInput 
                onSubmit={handleUrlSubmit}
                onCancel={() => {
                  setShowUrlInput(false);
                  setUrlError("");
                }}
                error={urlError}
              />
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
            />

            {isUploading && (
              <div className={styles.uploadingContainer}>
                <div className={styles.uploadingContent}>
                  <FaSpinner className={styles.spinner} />
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className={styles.progressText}>
                      Uploading... {uploadProgress}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <TipTapEditor
              content={content}
              onChange={setContent}
              onReady={handleEditorReady}
              onImageUploadClick={() => fileInputRef.current?.click()}
              onLinkClick={() => setShowUrlInput(true)}
            />
          </>
        )}

        {showPreview && (
          <div className={styles.contentPreview}>
            <h2 className={styles.previewTitle}>Preview</h2>
            <div className={styles.previewContainer}>
              {content ? (
                <div 
                  className={styles.previewContent}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className={styles.previewPlaceholder}>
                  Your content preview will appear here...
                </div>
              )}
            </div>
            <div className={styles.previewHelper}>
              This is how your post will look when published.
            </div>
          </div>
        )}
    
        {recentUploads && recentUploads.length > 0 && (
          <RecentUploads 
            uploads={recentUploads}
            onInsert={handleInsertRecentUpload}
            onDelete={handleDelete}
          />
        )}
      </div>
      
      <CategorySelector 
        category={category} 
        setCategory={setCategory} 
      />
      
      <div className={styles.actionButtons}>
        <button 
          className={styles.publish}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting && <FaSpinner className={styles.spinner} />}
          Publish Post
        </button>
        <button 
          className={styles.saveAsDraft}
          onClick={handleSaveAsDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </button>
      </div>
    </div>
  );
};

export default WritePage;
