'use client';

import { useEffect } from 'react';

const QuillCSS = () => {
  useEffect(() => {
    // Dynamically import the CSS only on the client side
    import('react-quill/dist/quill.snow.css');
  }, []);

  return null;
};

export default QuillCSS; 