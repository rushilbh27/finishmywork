# FinishMyWork Copilot Instructions

This document provides guidance for AI coding agents to effectively contribute to the FinishMyWork codebase.

## 🚀 Core Architecture

- **Framework**: Next.js 14 with App Router.
- **Language**: TypeScript.
- **UI**: Tailwind CSS with ShadCN UI components.
- **Database**: PostgreSQL with Prisma ORM. The schema is defined in `prisma/schema.prisma`.
- **Authentication**: NextAuth.js with credentials provider. Configuration is in `lib/auth.ts`.
- **Real-time**: Socket.IO for real-time features like chat and notifications. Server-side setup is in `lib/socketServer.ts` and client-side in `lib/socket.ts`.

## 🔑 Key Concepts & Patterns

- **API Routes**: Backend logic is implemented in Next.js API routes within `app/api/`. For example, task-related endpoints are in `app/api/tasks/`.
- **Prisma Client**: Use the shared Prisma client instance from `lib/prisma.ts`.
- **IDs are Integers**: All database model IDs (`User`, `Task`, etc.) are integers. When handling API route parameters, always parse them to integers (e.g., `parseInt(params.id)`).
- **NextAuth Session ID Type**: `session.user.id` is stored as a **string** but database IDs are **integers**. Always convert with `parseInt(String(session.user.id))` before comparing with database IDs.
- **Real-time Messaging**: Socket.IO doesn't work with Next.js App Router without a custom server. The chat system uses **3-second polling** as a fallback (`hooks/useTaskChat.tsx`). Messages are fetched periodically and auto-scroll is handled via `scrollIntoView()`.
- **Socket.IO Events**: For real-time updates, broadcast events using `broadcastMessage` from `lib/socketServer.ts`. Note: This is set up but not functional in production - polling is used instead.
- **Location-Based Features**: Users and Tasks have a mandatory `location` string. Tasks inherit their location from the user who posts them. See `LOCATION_FEATURE.md` for more details.
- **Styling**: Use Tailwind CSS utility classes and components from `components/ui/`. Avoid custom CSS files.

##  workflows

### Development Workflow

1.  **Setup**:
    -   Install dependencies: `npm install`
    -   Set up your `.env.local` file using `env.example`.
    -   Set up a local PostgreSQL database and run `npx prisma db push`.
2.  **Run**: `npm run dev` to start the development server.

### Testing

-   Run `npm run lint` and `npm run type-check` to check for code quality issues.
-   The script `scripts/test-production.js` can be used to verify the production setup, including database connections and basic model operations.
-   The script `scripts/test-task-lifecycle.js` tests the task lifecycle API endpoints and corresponding socket events.

## 📝 Important Files

-   `prisma/schema.prisma`: The single source of truth for the database schema.
-   `lib/prisma.ts`: Exports the singleton Prisma client.
-   `lib/auth.ts`: NextAuth.js configuration.
-   `lib/socketServer.ts`: Socket.IO server setup.
-   `app/api/`: Location of all backend API routes.
-   `components/ui/`: Reusable UI components from ShadCN.
-   `README.md` & `finishmywork_spec.md`: High-level project information and specifications.
-   `PRODUCTION_SCHEMA.md`: Detailed documentation of the production database schema.
