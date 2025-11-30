# Media Upload Feature

## Overview

FinishMyWork now supports rich media uploads for both tasks and chat messages, allowing users to attach images and documents to enhance communication.

## Features

### 📎 Task Media Upload
- **Location**: Task creation dialog (`PostTaskDialog`)
- **File Types**: Images (max 4MB, up to 5 files) and PDFs (max 8MB, up to 3 files)
- **Preview**: Real-time thumbnail preview with remove option
- **Storage**: mediaUrls stored as array in Task model
- **Display**: Media previews shown on task cards (first 3 thumbnails)

### 🖼️ Chat Media Upload
- **Location**: Chat input in `InlineTaskChat`
- **File Types**: Images (max 4MB) and PDFs (max 4MB)
- **Auto-send**: Uploaded files are automatically sent as messages
- **Display**: Images shown inline in chat bubbles, clickable to open full size
- **Real-time**: Media messages broadcast instantly via SSE

## Implementation Details

### Database Schema

#### Task Model
```prisma
model Task {
  // ... existing fields
  mediaUrls String[] @default([])
}
```

#### Message Model
```prisma
model Message {
  // ... existing fields
  type      String  @default("text")
  mediaUrl  String?
}
```

### API Routes

#### `/api/uploadthing/core.ts`
- Handles file uploads via UploadThing
- Two endpoints: `taskMedia` and `chatMedia`
- Auth middleware ensures only authenticated users can upload
- Returns file URLs on successful upload

#### Task Creation (`/api/tasks`)
- Accepts `mediaUrls` array in POST body
- Stores media URLs in database
- Broadcasts task with media to real-time feed

#### Message Creation (`/api/messages`)
- Accepts `type`, `mediaUrl` in POST body
- Supports "text", "image", and "file" message types
- Broadcasts media messages to chat participants

### Frontend Components

#### `components/uploadthing.tsx`
- Exports `UploadButton` and `UploadDropzone`
- Pre-configured with FinishMyWork file router

#### `components/ui/post-task-dialog.tsx`
- UploadButton for task media
- Preview grid with remove buttons
- Sends mediaUrls array with task creation payload

#### `components/chat/InlineTaskChat.tsx`
- UploadButton integrated into chat input
- Auto-detects file type (image vs file)
- Sends media as message with proper type and URL
- Renders images inline in message bubbles

#### `components/tasks/TaskCard.tsx`
- Shows first 3 media thumbnails
- "+N more" indicator for additional files
- Click to open media in new tab

## Configuration

### Environment Variables
Add to `.env.local`:

```bash
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
```

Get your credentials from [UploadThing Dashboard](https://uploadthing.com/dashboard).

### File Size Limits
- **Task Images**: 4MB max, 5 files
- **Task PDFs**: 8MB max, 3 files
- **Chat Images**: 4MB max, 1 file per upload
- **Chat PDFs**: 4MB max, 1 file per upload

## Usage

### For Users

#### Posting a Task with Media
1. Click "Post task" button
2. Fill in task details
3. Click "Choose File" under "Attach images or documents"
4. Select images or PDFs
5. Preview shows thumbnails with remove buttons
6. Submit task with media attached

#### Sending Media in Chat
1. Open a task conversation
2. Click the upload button (left of text input)
3. Select image or PDF
4. File uploads and sends automatically
5. Media appears inline in conversation

#### Viewing Media
- **Task Cards**: Click thumbnails to open full size in new tab
- **Chat Messages**: Click images to view full size
- **Task Details**: All media shown in task details page

### For Developers

#### Adding Upload to New Components
```tsx
import { UploadButton } from '@/components/uploadthing'

<UploadButton
  endpoint="taskMedia" // or "chatMedia"
  onClientUploadComplete={(res) => {
    const urls = res.map(f => f.url)
    // Handle uploaded URLs
  }}
  onUploadError={(error) => {
    console.error(error)
  }}
/>
```

#### Customizing File Router
Edit `lib/uploadthing.ts` to add new endpoints or change limits:

```ts
export const ourFileRouter = {
  newEndpoint: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 10 } 
  })
    .middleware(auth)
    .onUploadComplete(async ({ metadata, file }) => {
      // Handle completion
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter
```

## Security

### Authentication
- All uploads require authenticated session
- Middleware checks `session.user.id` before allowing upload
- Unauthorized requests return 401 error

### File Validation
- UploadThing validates file size and type on server
- Only allowed extensions are accepted
- Malicious files rejected automatically

### Access Control
- Only task participants can send chat media
- Media URLs are publicly accessible (via UploadThing CDN)
- Consider adding private storage for sensitive files

## Real-Time Integration

Media uploads integrate seamlessly with the existing SSE real-time system:

### Task Media
- New tasks with media broadcast via `broadcastTaskUpdate`
- Task feed shows media previews instantly
- No page refresh needed

### Chat Media
- Media messages broadcast via `broadcastMessage`
- Participants see images instantly
- Typing indicators work normally
- Message order preserved

## Future Enhancements

### Potential Improvements
1. **Video Support**: Add video uploads for tutorial tasks
2. **File Previews**: Better previews for PDFs and documents
3. **Image Compression**: Auto-compress large images client-side
4. **Drag & Drop**: Add drag-and-drop upload zones
5. **Gallery View**: Lightbox/carousel for viewing all task media
6. **Private Storage**: Option for private, expiring URLs
7. **Progress Indicators**: Show upload progress for large files
8. **Multiple Selection**: Allow multiple files in single upload

### Migration to Other Storage
If switching from UploadThing to S3/R2/Cloudinary:

1. Update `lib/uploadthing.ts` to new provider SDK
2. Keep same interface (`taskMedia`, `chatMedia` endpoints)
3. Return URLs in same format
4. Update environment variables
5. Components require no changes (URL-based)

## Troubleshooting

### Upload Fails
- Check `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` in `.env.local`
- Verify file size under limits
- Check file type is allowed (jpg, png, pdf, etc.)
- Inspect browser console for specific errors

### Media Not Displaying
- Verify URLs are stored in database (`mediaUrls`, `mediaUrl` fields)
- Check CORS settings if using custom storage
- Ensure images are publicly accessible
- Test URL directly in browser

### Real-Time Issues
- Media messages use same SSE system as text
- Check SSE connection in DevTools Network tab
- Verify `broadcastMessage` called in API route
- Check `useTaskChat` hook subscribes to events

## Resources

- [UploadThing Docs](https://docs.uploadthing.com)
- [Prisma Array Fields](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#scalar-list--scalar-arrays)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)

## Summary

Media upload is now fully integrated into FinishMyWork:
✅ Tasks support images & PDFs (up to 5 images, 3 PDFs)
✅ Chat supports instant media sharing
✅ Real-time delivery via SSE
✅ Secure, authenticated uploads
✅ Preview thumbnails on task cards
✅ Click to view full size
✅ Production-ready with UploadThing
