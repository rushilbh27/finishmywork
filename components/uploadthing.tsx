import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import imageCompression from "browser-image-compression";
import { useState } from "react";
import { motion } from "framer-motion";
 
import type { OurFileRouter } from "@/lib/uploadthing";
 
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

interface SmartUploadProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
  appearance?: any;
  content?: any;
  className?: string;
}

export function SmartUpload({ 
  endpoint, 
  onUploadComplete, 
  onUploadError,
  appearance,
  content,
  className 
}: SmartUploadProps) {
  const [progress, setProgress] = useState(0);

  async function handleBeforeUpload(files: File[]) {
    const compressed = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          compressed.push(compressedFile);
        } catch (error) {
          console.error("Compression failed, using original file:", error);
          compressed.push(file);
        }
      } else {
        compressed.push(file);
      }
    }
    return compressed;
  }

  return (
    <div className={className || "flex flex-col items-center gap-2"}>
      <UploadButton
        endpoint={endpoint}
        onBeforeUploadBegin={handleBeforeUpload}
        onUploadProgress={(p) => setProgress(p)}
        onClientUploadComplete={(res) => {
          setProgress(100);
          setTimeout(() => setProgress(0), 1000);
          onUploadComplete?.(res);
        }}
        onUploadError={onUploadError}
        appearance={appearance}
        content={content}
      />

      {progress > 0 && progress < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-xs"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
            className="h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
          />
        </motion.div>
      )}
    </div>
  );
}
