#!/usr/bin/env node

/**
 * Script to fix Task/Message/Review/Payment ID parsing
 * Changes parseInt(params.id) → params.id (string)
 * because all IDs are now String (CUID) in Prisma schema
 */

const fs = require('fs');
const path = require('path');

const files = [
  // Task routes
  'app/api/tasks/[id]/route.ts',
  'app/api/tasks/[id]/accept/route.ts',
  'app/api/tasks/[id]/cancel/route.ts',
  'app/api/tasks/[id]/complete/route.ts',
  'app/api/tasks/[id]/unassign/route.ts',
  
  // Admin routes
  'app/api/admin/tasks/[id]/route.ts',
  
  // Message routes
  'app/api/messages/[id]/route.ts',
  'app/api/messages/route.ts',
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
  
  // Pattern 1: parseInt(params.id) → params.id
  content = content.replace(
    /const\s+taskId\s*=\s*parseInt\(params\.id(?:,\s*10)?\)/g,
    'const taskId = params.id'
  );
  
  // Pattern 2: Number(params.id) → params.id
  content = content.replace(
    /const\s+id\s*=\s*Number\(params\.id\)/g,
    'const id = params.id'
  );
  
  // Pattern 3: isNaN(taskId) checks - remove them since strings don't need this
  content = content.replace(
    /if\s*\(isNaN\(taskId\)\)\s*\{[^}]+\}/g,
    '// Task ID is now a string (CUID), no need for isNaN check'
  );
  
  // Pattern 4: parseId function should return string for taskId
  // Update the parseId function to return strings for task IDs
  content = content.replace(
    /const parseId = \(value: unknown\): number \| null => \{[^}]+\}/gs,
    `const parseId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number') return String(value)
  return null
}`
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const lines = originalContent.split('\n').length;
    console.log(`✅ Fixed ${file}`);
    totalReplacements++;
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log(`\n🎉 Complete! Fixed ${totalReplacements} files.`);
console.log('\n📋 Summary:');
console.log('- All Task/Message/Review/Payment IDs are now strings (CUID)');
console.log('- Removed parseInt/Number conversions from params.id');
console.log('- Removed isNaN checks (no longer needed for strings)');
