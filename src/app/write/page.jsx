export const dynamicConfig = "force-dynamic";
export const runtime = "nodejs";

"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaSpinner, FaSun, FaMoon } from "react-icons/fa";
import toast from "react-hot-toast";
import('react-quill/dist/quill.snow.css');

import styles from "./styles/WritePage.module.css";
import CoverPhoto from "./components/CoverPhoto";
import MediaControls from "./components/MediaControls";
import UrlInput from "./components/UrlInput";
import RecentUploads from "./components/RecentUploads";
import CategorySelector from "./components/CategorySelector";

import { usePost } from "./hooks/usePost";
import { useEditor } from "./hooks/useEditor";
import { useMediaUpload } from "./hooks/useMediaUpload";
import { validateUrl } from "./utils/helpers";
import ReactQuill from "react-quill";


const WritePage = () => {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [urlError, setUrlError] = useState("");

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
    quillRef,
    insertImageAtCursor,
    insertUrlAtCursor
  } = useEditor();

  const {
    isUploading,
    uploadProgress,
    uploadError,
    recentUploads = [],
    handleUpload,
    handleDelete
  } = useMediaUpload();

  // Fix for addRange error
  useEffect(() => {
    // Wait for the editor to be fully mounted
    if (quillRef.current) {
      // Give the editor a moment to initialize
      const timer = setTimeout(() => {
        try {
          const editor = quillRef.current.getEditor();
          // Set initial selection to prevent addRange errors
          editor.setSelection(0, 0);
        } catch (error) {
          console.error("Error initializing editor:", error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [quillRef.current]);

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

  // Listen for image drop events from the editor
  useEffect(() => {
    const handleEditorImageDrop = (event) => {
      const { file } = event.detail;
      if (file) {
        handleImageSelect(file);
      }
    };

    document.addEventListener('editor-image-drop', handleEditorImageDrop);
    return () => {
      document.removeEventListener('editor-image-drop', handleEditorImageDrop);
    };
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Handle image selection
  const handleImageSelect = async (file) => {
    if (!file) return;
    
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
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Uploading image...');
      
      const imageUrl = await handleUpload(file);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (imageUrl) {
        insertImageAtCursor(imageUrl);
        setShowMediaMenu(false);
        toast.success('Image inserted successfully!');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Image upload error:", error);
    }
  };

  // Handle URL submission
  const handleUrlSubmit = (url) => {
    if (!url) return;
    
    if (!validateUrl(url)) {
      setUrlError("Please enter a valid URL");
      return;
    }
    
    insertUrlAtCursor(url);
    setShowUrlInput(false);
    setUrlError("");
  };

  // Handle recent upload insertion
  const handleInsertRecentUpload = (url) => {
    if (url) {
      insertImageAtCursor(url);
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
  // Configure Quill modules
  const modules = useMemo(
    () => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        'image': function() {
          fileInputRef.current?.click();
        }
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  // Configure Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

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
        <button 
          className={styles.themeToggle} 
          onClick={toggleThemeMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <CategorySelector 
        category={category} 
        setCategory={setCategory} 
      />

      <CoverPhoto 
        coverPhotoUrl={coverPhotoUrl} 
        setCoverPhotoUrl={setCoverPhotoUrl} 
      />

      <div className={styles.mediaSection}>
        <h2 className={styles.sectionTitle}>Content</h2>
        
        <MediaControls 
          onImageClick={() => fileInputRef.current?.click()}
          onUrlClick={() => {
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

          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={(value) => setContent(value)}
            modules={modules}
            formats={formats}
            
            placeholder="Write your story..."
            preserveWhitespace={true}
          />
    

        {recentUploads && recentUploads.length > 0 && (
          <RecentUploads 
            uploads={recentUploads}
            onInsert={handleInsertRecentUpload}
            onDelete={handleDelete}
          />
        )}
      </div>

      <div className={styles.contentPreview}>
        <h2 className={styles.previewTitle}>Preview</h2>
        <div className={styles.previewContainer}>
          {content ? (
            <div 
              className={styles.previewContent}
              dangerouslySetInnerHTML={{ 
                __html: content
                  // Hide image URLs in the preview
                  .replace(/<span class="image-url">(.*?)<\/span>/g, '')
                  // Ensure images have proper styling
                  .replace(/<img/g, '<img class="preview-image"')
              }}
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
