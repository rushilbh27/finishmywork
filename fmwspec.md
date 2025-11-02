# FinishMyWork PRODUCT SPEC

A unified spec for developers and Copilot to follow sequentially while building the FinishMyWork platform. Focus: clean, dark-glass design + real SaaS-grade UX + reliable backend logic.

---

## CORE TASK SYSTEM

### 1. Task Lifecycle
**Actors:** Poster & Acceptor  
- Create, Edit, Delete, Cancel, Complete  
- Status transitions: `open -> accepted -> in_progress -> completed -> cancelled`  
- Validation: posters can’t edit or delete accepted tasks  
- Real-time status updates via Supabase Realtime or Pusher

**Endpoints:**  
`POST /api/tasks`  
`PATCH /api/tasks/:id/edit`  
`PATCH /api/tasks/:id/cancel`  
`PATCH /api/tasks/:id/complete`  
`DELETE /api/tasks/:id`

---

## USER INTERACTIONS

### 2. User Blocking (Mutual)
- Either user can block the other  
- Blocks tasks, chat, and profile visibility  
- `blocked_users (blockerId, blockedId)`  

---

### 3. Reviews & Ratings
- Both poster and acceptor can review after completion  
- 1–5 rating + comment  
- Display average on profile  
- `reviews (reviewerId, reviewedId, taskId, rating, comment, createdAt)`

---

### 4. Reports & Safety
- Report users or tasks  
- Reason: spam, scam, abuse, etc.  
- Admin panel to review reports  
- `reports (reporterId, reportedUserId?, reportedTaskId?, reason, details, createdAt, status)`

---

## COMMUNICATION & FEEDBACK

### 5. Chat (Poster & Acceptor)
- Opens after task accepted  
- Realtime via Supabase or Socket.io  
- Supports text + images + attachments  
- `chats (id, taskId, posterId, acceptorId)`  
- `messages (chatId, senderId, content, type, createdAt, read)`

---

### 6. Notifications
- Real-time & persistent  
- Toasts for active users  
- Timestamps (e.g., 2m ago)  
- Stored + marked as read  
- `notifications (userId, type, message, link, read, createdAt)`

---

## DASHBOARD EXPERIENCE

### 7. Dashboard Overhaul
- Task summary cards (Open, In Progress, Completed)  
- Activity feed (e.g., Your task "Design Logo" was accepted 3h ago)  
- Quick actions: Post Task, View Earnings, Edit Profile  
- Unified dark-glass design

---

## EMAIL & PUSH INFRASTRUCTURE

### 8. Email + Push Notifications
- Email verification  
- Forgot password  
- Resend verification  
- 2FA setup (later)  
- Transactional notifications (Task accepted, cancelled, etc.)  
- Stack: Resend / Postmark + OneSignal / FCM

---

## SAFETY & MODERATION

### 9. Reports + Admin Tools
- Report button on users/tasks  
- Moderation dashboard  
- Temporary suspensions / warnings  
- Email notification on moderation actions  

---

## PAYMENTS

### 10. UPI & Wallet
- Manual UPI (rushilbhor@okaxis) for MVP  
- Optional QR verification  
- Razorpay / Cashfree integration later  
- `wallets (userId, balance)`  
- `transactions (userId, amount, taskId, status)`

---

## DESIGN & THEME CONSISTENCY

### 11. Dark Glass UI
- Default dark theme  
- Gradient backgrounds (blue-violet)  
- Unified palette using ShadCN + Tailwind  
- Theme toggle (next-themes)  
- Remove light sections sitewide  
- Smooth transitions and hover effects

---

## DEVELOPMENT PLAN

| Phase | Goal | Includes |
|--------|------|----------|
| 1 | Core Tasks | CRUD, cancel, complete |
| 2 | User Interactions | Reviews, blocking |
| 3 | Chat + Notifications | Realtime + persistent |
| 4 | Dashboard UX | Stats, activity feed |
| 5 | Email + Push | Auth + events |
| 6 | Payments | Manual UPI integration |
| 7 | Safety | Reports + moderation |
| 8 | Polish | Dark-glass consistency, cleanup |

---

## ENHANCEMENTS
- XP / points system for reliability  
- Verified badges for trusted users  
- Search + filter system for tasks  
- PWA app mode  
- "AI Copilot" to auto-write task descriptions  

---

## DATABASE TABLES
```
users
tasks
task_applications
reviews
blocked_users
chats
messages
notifications
reports
wallets
transactions
```

---

## RULES FOR IMPLEMENTATION
1. Follow the phases sequentially.  
2. Each phase must compile with no TypeScript errors.  
3. Never mix light and dark theme elements.  
4. Every API route must have validation and role-checking.  
5. Test task actions manually before moving on.

