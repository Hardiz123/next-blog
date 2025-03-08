export const extractYoutubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const isVideoUrl = (url) => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const validateUrl = (url, type) => {
  if (!url || !url.trim()) return false;

  // If no specific type is provided, validate as a general URL
  if (!type) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  switch (type) {
    case "youtube":
      return extractYoutubeId(url) !== null;
    case "video":
      return isVideoUrl(url);
    case "link":
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}; 