// Automated integration test for FinishMyWork task lifecycle and real-time updates
// Run with: node scripts/test-task-lifecycle.js

const axios = require('axios');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

async function runTest() {
  let socketEvents = [];
  const socket = io(SOCKET_URL);

  socket.on('task:update', (data) => {
    console.log('Socket event:', data);
    socketEvents.push(data);
  });

  // 1. Create a task
  const createRes = await axios.post(`${API_BASE}/tasks`, {
    title: 'Test Task',
    description: 'Automated test',
    price: 10,
    location: 'Test Location',
  });
  const task = createRes.data;
  console.log('Created task:', task);

  // 2. Edit the task
  const editRes = await axios.patch(`${API_BASE}/tasks/${task.id}/edit`, {
    title: 'Test Task Edited',
    description: 'Edited by automation',
  });
  console.log('Edited task:', editRes.data);

  // 3. Accept the task
  const acceptRes = await axios.patch(`${API_BASE}/tasks/${task.id}/accept`);
  console.log('Accepted task:', acceptRes.data);

  // 4. Cancel the task
  const cancelRes = await axios.patch(`${API_BASE}/tasks/${task.id}/cancel`);
  console.log('Canceled task:', cancelRes.data);

  // 5. Complete the task
  const completeRes = await axios.patch(`${API_BASE}/tasks/${task.id}/complete`);
  console.log('Completed task:', completeRes.data);

  // 6. Delete the task
  const deleteRes = await axios.delete(`${API_BASE}/tasks/${task.id}`);
  console.log('Deleted task:', deleteRes.data);

  // Wait for real-time events to propagate
  await new Promise((resolve) => setTimeout(resolve, 2000));
  socket.disconnect();

  // Summary
  console.log('Socket events received:', socketEvents);
  if (socketEvents.length >= 6) {
    console.log('✅ Real-time updates received for all lifecycle actions.');
  } else {
    console.log('❌ Missing some real-time events.');
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
