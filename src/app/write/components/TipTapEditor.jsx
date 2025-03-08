'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useState } from 'react';
import styles from '../styles/TipTapEditor.module.css';
import { 
  FaBold, FaItalic, FaHeading, FaListUl, FaListOl, 
  FaQuoteLeft, FaImage, FaLink, FaUndo, FaRedo,
  FaFont, FaCaretDown
} from 'react-icons/fa';

const TipTapEditor = ({ 
  content, 
  onChange, 
  onReady,
  onImageUploadClick,
  onLinkClick
}) => {
  const [showTextSizeOptions, setShowTextSizeOptions] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      // Expose methods to window for parent component access
      window.tiptapEditor = {
        insertImage: (url) => {
          editor.chain().focus().setImage({ src: url }).run();
        },
        insertLink: (url) => {
          if (editor.isActive('link')) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          } else {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        isReady: true,
      };
      
      // Notify parent component that editor is ready
      if (onReady) {
        onReady(editor);
      }
    }
    
    return () => {
      // Clean up when component unmounts
      if (window.tiptapEditor) {
        window.tiptapEditor.isReady = false;
      }
    };
  }, [editor, onReady]);

  const setTextSize = useCallback((size) => {
    if (!editor) return;
    
    editor.chain().focus().run();
    
    if (size === 'normal') {
      editor.chain().focus().setParagraph().run();
    } else if (size === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (size === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (size === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (size === 'h4') {
      editor.chain().focus().toggleHeading({ level: 4 }).run();
    } else if (size === 'h5') {
      editor.chain().focus().toggleHeading({ level: 5 }).run();
    } else if (size === 'h6') {
      editor.chain().focus().toggleHeading({ level: 6 }).run();
    }
  }, [editor]);

  const getActiveTextSize = useCallback(() => {
    if (!editor) return 'normal';
    
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    
    return 'normal';
  }, [editor]);

  if (!editor) {
    return <div className={styles.loading}>Loading editor...</div>;
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.isActive : ''}
          title="Bold"
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.isActive : ''}
          title="Italic"
        >
          <FaItalic />
        </button>
        
        <div className={styles.textSizeDropdown}>
          <button
            onClick={() => setShowTextSizeOptions(!showTextSizeOptions)}
            className={styles.textSizeButton}
            title="Text Size"
          >
            <FaFont />
            <FaCaretDown style={{ fontSize: '0.7em' }} />
          </button>
          
          {showTextSizeOptions && (
            <div className={styles.textSizeOptions}>
              <button
                onClick={() => {
                  setTextSize('normal');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'normal' ? styles.isActive : ''}
              >
                Normal
              </button>
              <button
                onClick={() => {
                  setTextSize('h1');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h1' ? styles.isActive : ''}
                style={{ fontSize: '2em' }}
              >
                Heading 1
              </button>
              <button
                onClick={() => {
                  setTextSize('h2');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h2' ? styles.isActive : ''}
                style={{ fontSize: '1.5em' }}
              >
                Heading 2
              </button>
              <button
                onClick={() => {
                  setTextSize('h3');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h3' ? styles.isActive : ''}
                style={{ fontSize: '1.17em' }}
              >
                Heading 3
              </button>
              <button
                onClick={() => {
                  setTextSize('h4');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h4' ? styles.isActive : ''}
              >
                Heading 4
              </button>
              <button
                onClick={() => {
                  setTextSize('h5');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h5' ? styles.isActive : ''}
                style={{ fontSize: '0.83em' }}
              >
                Heading 5
              </button>
              <button
                onClick={() => {
                  setTextSize('h6');
                  setShowTextSizeOptions(false);
                }}
                className={getActiveTextSize() === 'h6' ? styles.isActive : ''}
                style={{ fontSize: '0.67em' }}
              >
                Heading 6
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.isActive : ''}
          title="Bullet List"
        >
          <FaListUl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.isActive : ''}
          title="Numbered List"
        >
          <FaListOl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.isActive : ''}
          title="Quote"
        >
          <FaQuoteLeft />
        </button>
        <button
          onClick={onImageUploadClick}
          title="Insert Image"
        >
          <FaImage />
        </button>
        <button
          onClick={onLinkClick}
          className={editor.isActive('link') ? styles.isActive : ''}
          title="Insert Link"
        >
          <FaLink />
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <FaUndo />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <FaRedo />
        </button>
      </div>
      <EditorContent editor={editor} className={styles.editor} />
    </div>
  );
};

export default TipTapEditor; 