import { useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useEditor = () => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Memoize the insertImageAtCursor function to avoid recreating it on each render
  const insertImageAtCursor = useCallback((imageUrl) => {
    if (!quillRef.current) {
      console.error('Quill editor not initialized');
      return;
    }
    
    try {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      
      // Remove the 'Uploading image...' text if it exists
      if (editor.getText().includes('Uploading image...')) {
        const text = editor.getText();
        const uploadingIndex = text.indexOf('Uploading image...');
        if (uploadingIndex >= 0) {
          editor.deleteText(uploadingIndex, 'Uploading image...'.length);
        }
      }
      
      // Add newline before image if needed
      if (index > 0 && editor.getText(index - 1, 1) !== '\n') {
        editor.insertText(index, '\n', { source: 'user' });
      }
      
      // Insert image
      const currentPos = editor.getSelection() ? editor.getSelection().index : index;
      editor.insertEmbed(currentPos, 'image', imageUrl, { source: 'user' });
      
      // Add newline after image
      editor.insertText(currentPos + 1, '\n', { source: 'user' });
      
      // Insert URL with special class
      const urlTextPos = currentPos + 2;
      editor.insertText(urlTextPos, imageUrl, { 
        source: 'user'
      });
      
      // Format the URL text as a special class
      editor.formatText(urlTextPos, imageUrl.length, {
        'class': 'image-url'
      });
      
      // Add final newline
      editor.insertText(urlTextPos + imageUrl.length, '\n', { source: 'user' });
      editor.setSelection(urlTextPos + imageUrl.length + 1, 0);
    } catch (error) {
      console.error('Error inserting image:', error);
      toast.error('Failed to insert image. Please try again.');
    }
  }, []);

  // Memoize the insertUrlAtCursor function
  const insertUrlAtCursor = useCallback((url) => {
    if (!quillRef.current) {
      console.error('Quill editor not initialized');
      return;
    }
    
    try {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      
      if (range) {
        if (range.length === 0) {
          editor.insertText(range.index, url);
          editor.setSelection(range.index, url.length);
          editor.format('link', url);
        } else {
          editor.format('link', url);
        }
      } else {
        const index = editor.getLength();
        editor.insertText(index, url);
        editor.setSelection(index, url.length);
        editor.format('link', url);
      }
    } catch (error) {
      console.error('Error inserting URL:', error);
      toast.error('Failed to insert link. Please try again.');
    }
  }, []);

  // Setup drag and drop handling
  useEffect(() => {
    let cleanupTimeout;
    
    const setupDropHandler = () => {
      if (!quillRef.current) return;
      
      try {
        const editor = quillRef.current.getEditor();
        const editorContainer = editor.root;

        const handleDragOver = (e) => {
          e.preventDefault();
          e.stopPropagation();
          editorContainer.classList.add('dropActive');
        };

        const handleDragLeave = () => {
          editorContainer.classList.remove('dropActive');
        };

        const handleDrop = (e) => {
          e.preventDefault();
          e.stopPropagation();
          editorContainer.classList.remove('dropActive');
          
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
              // Store cursor position for later insertion
              const range = editor.getSelection();
              if (range) {
                editor.insertText(range.index, 'Uploading image...', 'user');
              }
              
              // Emit an event or use a callback to handle the file upload
              const uploadEvent = new CustomEvent('editor-image-drop', { 
                detail: { file: droppedFile } 
              });
              typeof document !== "undefined" && document.dispatchEvent(uploadEvent);
            } else {
              toast.error('Only image files can be dropped into the editor');
            }
          }
        };

        editorContainer.addEventListener('dragover', handleDragOver);
        editorContainer.addEventListener('dragleave', handleDragLeave);
        editorContainer.addEventListener('drop', handleDrop);

        return () => {
          editorContainer.removeEventListener('dragover', handleDragOver);
          editorContainer.removeEventListener('dragleave', handleDragLeave);
          editorContainer.removeEventListener('drop', handleDrop);
        };
      } catch (error) {
        console.error('Error setting up drop handler:', error);
        return () => {};
      }
    };

    // Wait for the editor to be available
    if (quillRef.current) {
      cleanupTimeout = setTimeout(() => {
        const cleanup = setupDropHandler();
        return () => {
          cleanup && cleanup();
        };
      }, 500);
    }
    
    return () => {
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
      }
    };
  }, [quillRef.current]);

  // Add custom image handler to Quill
  useEffect(() => {
    let imageHandlerTimeout;
    
    const setupImageHandler = () => {
      if (!quillRef.current) return;
      
      try {
        const editor = quillRef.current.getEditor();
        
        // Add custom class to images
        editor.clipboard.addMatcher('img', (node, delta) => {
          delta.ops.forEach(op => {
            if (op.insert && op.insert.image) {
              op.attributes = { ...op.attributes, class: 'quill-image' };
            }
          });
          return delta;
        });
        
        // Override default image handler
        const toolbar = editor.getModule('toolbar');
        if (toolbar) {
          // Store the original handler if needed
          const originalHandler = toolbar.handlers.image;
          
          // Set our custom handler
          toolbar.handlers.image = function() {
            // This will be handled by the onClick handler in the React component
            const fileInput = typeof document !== "undefined" && document.querySelector('input[type=file][accept*="image"]');
            if (fileInput) {
              fileInput.click();
            }
          };
        }
      } catch (error) {
        console.error('Error setting up image handler:', error);
      }
    };
    
    if (quillRef.current) {
      imageHandlerTimeout = setTimeout(setupImageHandler, 500);
    }
    
    return () => {
      if (imageHandlerTimeout) {
        clearTimeout(imageHandlerTimeout);
      }
    };
  }, [quillRef.current]);

  return {
    quillRef,
    editorRef,
    insertImageAtCursor,
    insertUrlAtCursor
  };
}; 