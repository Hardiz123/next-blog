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
import dynamic from "next/dynamic";
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
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading editor...</div>,
});

// Component to load CSS only on client side
const ClientOnlyStyle = () => {
  useEffect(() => {
    // Import CSS only on client side
    import('react-quill/dist/quill.snow.css');
  }, []);
  return null;
};
