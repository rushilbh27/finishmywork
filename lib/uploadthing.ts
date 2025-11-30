import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

// Auth middleware for UploadThing
const auth = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return { userId: session.user.id };
};

// File router for different upload types
export const ourFileRouter = {
  taskMedia: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 5 }, 
    pdf: { maxFileSize: "8MB", maxFileCount: 3 } 
  })
    .middleware(auth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task media upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
    
  chatMedia: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 }
  })
    .middleware(auth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Chat media upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
