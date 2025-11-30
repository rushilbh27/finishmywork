export const fileIcon = (url: string): string => {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.endsWith(".pdf")) return "📄";
  if (lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx")) return "📝";
  if (lowerUrl.endsWith(".xls") || lowerUrl.endsWith(".xlsx")) return "📊";
  if (lowerUrl.endsWith(".ppt") || lowerUrl.endsWith(".pptx")) return "📽️";
  if (lowerUrl.endsWith(".zip") || lowerUrl.endsWith(".rar")) return "🗜️";
  if (lowerUrl.endsWith(".txt")) return "📃";
  return "📎";
};

export const isImage = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

export const getFileType = (url: string): "image" | "document" => {
  return isImage(url) ? "image" : "document";
};
