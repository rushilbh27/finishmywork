# Media Upload - Setup Checklist

## 🚀 Quick Start Guide

Follow these steps to enable media upload in your FinishMyWork deployment:

---

## 1️⃣ Get UploadThing Credentials

1. Go to https://uploadthing.com
2. Sign up or log in
3. Create a new app
4. Copy your credentials:
   - `UPLOADTHING_SECRET` (starts with `sk_live_...`)
   - `UPLOADTHING_APP_ID`

---

## 2️⃣ Add Environment Variables

Add to your `.env.local` file:

```bash
UPLOADTHING_SECRET="sk_live_your_secret_here"
UPLOADTHING_APP_ID="your_app_id_here"
```

**Note**: These are already in `.env.example` as a template.

---

## 3️⃣ Verify Database Schema

The schema has been updated and pushed. Verify with:

```bash
npx prisma db push
npx prisma generate
```

Expected changes:
- `Task` model now has `mediaUrls: String[]`
- `Message` model now has `type: String` and `mediaUrl: String?`

---

## 4️⃣ Test the Feature

### Test Task Media Upload

1. Start the dev server: `npm run dev`
2. Navigate to `/tasks`
3. Click "Post task"
4. Fill in task details
5. Look for "Attach images or documents (optional)"
6. Click "Choose File"
7. Select an image or PDF
8. Verify thumbnail preview appears
9. Submit the task
10. Verify media appears on the task card

### Test Chat Media Upload

1. Accept a task or have someone accept yours
2. Open the task conversation
3. Look for upload button (left of text input)
4. Click and select an image
5. Verify file uploads and sends automatically
6. Verify image appears inline in chat
7. Click image to view full size

---

## 5️⃣ Production Deployment

### Vercel/Netlify

1. Add environment variables to your deployment platform:
   - `UPLOADTHING_SECRET`
   - `UPLOADTHING_APP_ID`

2. Deploy as normal:
   ```bash
   git add .
   git commit -m "Add media upload feature"
   git push
   ```

3. Verify environment variables are set in dashboard

### Railway/Render

1. Add environment variables to your service
2. Redeploy the application
3. Test uploads in production

---

## 6️⃣ Verify Everything Works

### Checklist

- [ ] Environment variables set in `.env.local`
- [ ] `npm run dev` starts without errors
- [ ] Can upload images to tasks
- [ ] Can upload PDFs to tasks
- [ ] Thumbnails appear on task cards
- [ ] Can upload images in chat
- [ ] Images display inline in chat
- [ ] Click to view full size works
- [ ] Real-time delivery works (test with two users)
- [ ] Toast notifications appear on upload
- [ ] Upload errors show helpful messages

---

## 🐛 Troubleshooting

### "Unauthorized" Error on Upload

**Problem**: Upload fails with 401 error

**Solution**:
- Verify you're signed in
- Check `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set
- Restart dev server after adding env vars

### Media Not Displaying

**Problem**: Upload succeeds but media doesn't show

**Solution**:
- Check browser console for errors
- Verify URL is stored in database
- Test URL directly in browser
- Check CORS settings if using custom domain

### Upload Fails Silently

**Problem**: Nothing happens when clicking upload

**Solution**:
- Open browser DevTools → Console
- Look for JavaScript errors
- Verify UploadThing SDK loaded correctly
- Check network tab for failed requests

### File Size Error

**Problem**: "File too large" error

**Solution**:
- Images: Max 4MB
- PDFs: Max 8MB for tasks, 4MB for chat
- Reduce file size or compress image
- Limits can be changed in `lib/uploadthing.ts`

---

## 📚 Documentation

- **Feature Overview**: `MEDIA_UPLOAD_FEATURE.md`
- **Implementation Summary**: `MEDIA_UPLOAD_SUMMARY.md`
- **UploadThing Docs**: https://docs.uploadthing.com
- **This Checklist**: `MEDIA_UPLOAD_SETUP.md`

---

## 🎯 Success Criteria

You're ready to ship when:

✅ Environment variables configured
✅ Task media upload works
✅ Chat media upload works
✅ Thumbnails display correctly
✅ Real-time delivery verified
✅ Build completes without errors
✅ Deployed to production

---

## 💡 Tips

- **Free Tier**: UploadThing offers generous free tier
- **Custom Storage**: Can swap to S3/R2 later (see `MEDIA_UPLOAD_FEATURE.md`)
- **File Limits**: Configurable in `lib/uploadthing.ts`
- **Styling**: Upload button styled via `className` prop with Tailwind
- **Security**: Auth middleware ensures only signed-in users upload

---

## ✨ Next Steps

Once media upload is working:

1. Monitor usage in UploadThing dashboard
2. Consider adding video support
3. Add drag & drop for better UX
4. Implement gallery view for task media
5. Add image compression to reduce file sizes
6. Set up analytics to track upload success rates

---

**Need Help?** Check `MEDIA_UPLOAD_FEATURE.md` for detailed documentation and troubleshooting.
