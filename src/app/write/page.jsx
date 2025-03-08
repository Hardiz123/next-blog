// Mark this page as dynamic to prevent static generation
export const dynamic = "force-dynamic";
// Use Node.js runtime
export const runtime = "nodejs";
// Disable static generation
export const generateStaticParams = () => [];

"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaSun, FaMoon } from "react-icons/fa";
import toast from "react-hot-toast";
import { default as dynamicImport } from "next/dynamic";
import styles from "./styles/WritePage.module.css";

// Import components
import CoverPhoto from "./components/CoverPhoto";
import MediaControls from "./components/MediaControls";
import UrlInput from "./components/UrlInput";
import RecentUploads from "./components/RecentUploads";
import CategorySelector from "./components/CategorySelector";

// Import hooks and utilities
import { usePost } from "./hooks/usePost";
import { useEditor } from "./hooks/useEditor";
import { useMediaUpload } from "./hooks/useMediaUpload";
import { validateUrl } from "./utils/helpers";

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamicImport(
  async () => {
    const { default: RQ } = await import("react-quill");
    // Import CSS only on client side
    if (typeof window !== 'undefined') {
      await import("react-quill/dist/quill.snow.css");
    }
    return RQ;
  },
  { 
    ssr: false,
    loading: () => <div className={styles.loading}>Loading editor...</div>
  }
);

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
  }, [quillRef]);

  // Check for dark mode preference on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
    if (typeof window === 'undefined') return;
    
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
  const handleImageSelect = useCallback(async (file) => {
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
  }, [handleUpload, insertImageAtCursor, setShowMediaMenu]);

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
    if (typeof window === 'undefined') return;
    
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
      
      <CoverPhoto 
        coverPhotoUrl={coverPhotoUrl} 
        setCoverPhotoUrl={setCoverPhotoUrl} 
      />
      
      <div className={styles.editorContainer}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileInputChange}
        />
        
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Write your story..."
          className={styles.editor}
        />
        
        <MediaControls 
          onImageClick={() => fileInputRef.current?.click()}
          onUrlClick={() => setShowUrlInput(true)}
          onRecentClick={() => setShowMediaMenu(!showMediaMenu)}
          showMediaMenu={showMediaMenu}
        />
        
        {showUrlInput && (
          <UrlInput 
            onSubmit={handleUrlSubmit}
            onClose={() => setShowUrlInput(false)}
            error={urlError}
          />
        )}
        
        {showMediaMenu && (
          <RecentUploads 
            uploads={recentUploads}
            onSelect={handleInsertRecentUpload}
            onDelete={handleDelete}
          />
        )}
      </div>
      
      <div className={styles.categoryContainer}>
        <CategorySelector 
          selectedCategory={category}
          onSelect={setCategory}
        />
      </div>
      
      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.button} ${styles.draftButton}`}
          onClick={handleSaveAsDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </button>
        <button 
          className={`${styles.button} ${styles.publishButton}`}
          onClick={handleSubmit}
          disabled={isSubmitting || !title || !content}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className={styles.spinner} />
              Publishing...
            </>
          ) : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default WritePage;
