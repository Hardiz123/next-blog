"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./authLinks.module.css";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { FaSignOutAlt, FaUser, FaPencilAlt, FaSpinner } from "react-icons/fa";

const AuthLinks = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  
  const { data: session, status } = useSession();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      // The session will be updated automatically by useSession
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // We'll keep the loading state active as page will reload/redirect anyway
    }
  };

  return (
    <>
      {status === "unauthenticated" ? (
        <Link href="/login" className={styles.link}>
          Login
        </Link>
      ) : status === "loading" ? (
        <div className={styles.loadingAuth}>
          <FaSpinner className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.authContainer}>
          <Link href="/write" className={styles.writeLink}>
            <FaPencilAlt className={styles.writeIcon} />
            <span className={styles.writeText}>Write</span>
          </Link>
          
          <div className={styles.userSection} ref={dropdownRef}>
            <div 
              className={styles.profileButton} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {session?.user?.image ? (
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  width={36} 
                  height={36} 
                  className={styles.userImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {(session?.user?.name?.charAt(0) || "U").toUpperCase()}
                </div>
              )}
              <span className={styles.userName}>
                {session?.user?.name?.split(" ")[0] || "User"}
              </span>
            </div>
            
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.userFullName}>{session?.user?.name}</span>
                    <span className={styles.userEmail}>{session?.user?.email}</span>
                  </div>
                </div>
                <div className={styles.dropdownDivider}></div>
                <Link href="/profile" className={styles.dropdownItem}>
                  <FaUser className={styles.dropdownIcon} />
                  <span>Profile</span>
                </Link>
                <button 
                  className={styles.dropdownItem} 
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <FaSpinner className={`${styles.dropdownIcon} ${styles.spinner}`} />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt className={styles.dropdownIcon} />
                      <span>Logout</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.burger} onClick={() => setOpen(!open)}>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
      </div>
      
      {open && (
        <div className={styles.responsiveMenu}>
          <Link href="/">Homepage</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          {status === "unauthenticated" ? (
            <Link href="/login">Login</Link>
          ) : (
            <>
              <Link href="/write">Write</Link>
              <Link href="/profile">Profile</Link>
              <button onClick={handleSignOut} className={styles.logoutButton}>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AuthLinks;
