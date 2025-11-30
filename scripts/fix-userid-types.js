#!/usr/bin/env node

/**
 * Script to fix User ID type mismatches
 * Replaces parseInt(String(session.user.id)) → String(session.user.id)
 * because User IDs are now String (CUID) in Prisma schema
 */

const fs = require('fs');
const path = require('path');

const files = [
  // API Routes - User
  'app/api/user/profile/route.ts',
  'app/api/user/name/route.ts',
  'app/api/user/avatar/route.ts',
  'app/api/user/delete/route.ts',
  'app/api/user/verify-email/route.ts',
  'app/api/user/password/route.ts',
  
  // API Routes - Notifications
  'app/api/notifications/route.ts',
  'app/api/notifications/read/route.ts',
  'app/api/notifications/debug/route.ts',
  
  // API Routes - Tasks
  'app/api/tasks/posted/route.ts',
  'app/api/tasks/[id]/route.ts',
  'app/api/tasks/[id]/accept/route.ts',
  'app/api/tasks/[id]/complete/route.ts',
  'app/api/tasks/[id]/cancel/route.ts',
  'app/api/tasks/[id]/unassign/route.ts',
  
  // API Routes - Messages & Chat
  'app/api/messages/route.ts',
  'app/api/messages/[id]/route.ts',
  'app/api/chat/threads/route.ts',
  'app/api/chat/typing/route.ts',
  'app/api/chat/events/route.ts',
  
  // API Routes - Dashboard
  'app/api/dashboard/stats/route.ts',
  
  // Components
  'components/tasks/TaskCard.tsx',
  'components/chat/InlineTaskChat.tsx',
  
  // Pages
  'app/(app)/dashboard/page.tsx',
  'app/(app)/messages/page.tsx',
  'app/(app)/tasks/[id]/page.tsx',
];

const rootDir = '/Users/rushilbhor/Desktop/finishmywork';

let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping (not found): ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Pattern 1: parseInt(String(session.user.id)) → String(session.user.id)
  content = content.replace(
    /parseInt\(String\(session\.user\.id\)\)/g,
    'String(session.user.id)'
  );
  
  // Pattern 2: parseInt(String(session.user.id), 10) → String(session.user.id)
  content = content.replace(
    /parseInt\(String\(session\.user\.id\),\s*10\)/g,
    'String(session.user.id)'
  );
  
  // Pattern 3: Number.parseInt(String(session.user.id), 10) → String(session.user.id)
  content = content.replace(
    /Number\.parseInt\(String\(session\.user\.id\),\s*10\)/g,
    'String(session.user.id)'
  );
  
  // Pattern 4: parseInt(session.user.id) → String(session.user.id)
  content = content.replace(
    /parseInt\(session\.user\.id\)/g,
    'String(session.user.id)'
  );
  
  // Pattern 5: parseInt(session.user.id as string) → session.user.id
  content = content.replace(
    /parseInt\(session\.user\.id as string\)/g,
    'session.user.id'
  );
  
  // Pattern 6: parseInt(session.user.id as string, 10) → session.user.id
  content = content.replace(
    /parseInt\(session\.user\.id as string,\s*10\)/g,
    'session.user.id'
  );
  
  // Pattern 7: Number.parseInt(session.user.id, 10) → String(session.user.id)
  content = content.replace(
    /Number\.parseInt\(session\.user\.id,\s*10\)/g,
    'String(session.user.id)'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const replacements = originalContent.split('parseInt').length - 1;
    totalReplacements += replacements;
    console.log(`✅ Fixed ${file} (${replacements} replacement${replacements !== 1 ? 's' : ''})`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log(`\n🎉 Complete! Fixed ${totalReplacements} parseInt instances across ${files.length} files.`);
console.log('\n📋 Summary:');
console.log('- All session.user.id comparisons now use String() for type safety');
console.log('- User IDs are CUID strings, not integers');
console.log('- Prisma will no longer throw validation errors');
