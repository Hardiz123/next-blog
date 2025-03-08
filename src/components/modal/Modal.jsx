"use client";

import React, { useEffect, useRef } from 'react';
import styles from './modal.module.css';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onConfirm, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  confirmButtonClass = "",
  type = "default" // can be 'default', 'danger', 'warning', 'success'
}) {
  const modalRef = useRef(null);
  
  // Handle clicking outside the modal to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Handle ESC key to close modal
    function handleEscKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    // Only add listeners if the modal is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div 
        className={`${styles.modalContainer} ${styles[type]}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            {type === 'danger' && <FaExclamationTriangle className={styles.warningIcon} />}
            {title}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          {children}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button 
              className={`${styles.confirmButton} ${styles[confirmButtonClass]}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 