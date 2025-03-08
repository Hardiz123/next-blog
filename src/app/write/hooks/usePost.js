import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { slugify } from '../utils/helpers';
import { getApiUrl } from '@/utils/apiUrl';

export const usePost = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe content setter to prevent null/undefined values
  const safeSetContent = (newContent) => {
    if (newContent === null || newContent === undefined) {
      setContent('');
    } else {
      setContent(newContent);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error('Please fill in title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/api/posts'), {
        method: 'POST',
        body: JSON.stringify({
          title,
          desc: content,
          img: coverPhotoUrl,
          slug: slugify(title),
          catSlug: category || 'style', // Default to 'style' if no category selected
        }),
      });

      if (res.status === 200) {
        const data = await res.json();
        toast.success('Post published successfully!');
        router.push(`/posts/${data.slug}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Something went wrong!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = () => {
    // Implement draft saving functionality
    toast.info('Draft saving not implemented yet');
  };

  return {
    title,
    setTitle,
    content,
    setContent: safeSetContent,
    category,
    setCategory,
    coverPhotoUrl,
    setCoverPhotoUrl,
    isSubmitting,
    handleSubmit,
    handleSaveAsDraft
  };
}; 