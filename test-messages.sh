#!/bin/bash

echo "Testing message sending..."

# Test 1: Send a message
echo "1. Sending a test message..."
response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"taskId": 2, "receiverId": 2, "content": "Test message from script - '$(date)'"}')

status_code="${response: -3}"
body="${response:0:-3}"

echo "Response code: $status_code"
echo "Response body: $body"

if [ "$status_code" -eq 200 ]; then
    echo "✅ Message sent successfully!"
else
    echo "❌ Failed to send message. Status: $status_code"
fi

echo ""
echo "2. Fetching messages..."

# Test 2: Get messages
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/messages?taskId=2)
status_code="${response: -3}"
body="${response:0:-3}"

echo "Response code: $status_code"
echo "Messages: $body"

if [ "$status_code" -eq 200 ]; then
    echo "✅ Messages fetched successfully!"
else
    echo "❌ Failed to fetch messages. Status: $status_code"
fi