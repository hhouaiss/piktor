#!/bin/bash

# Stripe Webhook Forwarding for Local Development
# This script forwards Stripe webhooks to your local server

echo "🚀 Starting Stripe Webhook Forwarding..."
echo "📍 Forwarding to: http://localhost:3000/api/stripe/webhook"
echo ""
echo "⚠️  Keep this terminal window open while developing"
echo "💡 Copy the webhook signing secret (whsec_...) to your .env.local file"
echo ""

# Start Stripe CLI webhook forwarding
stripe listen \
  --forward-to localhost:3000/api/stripe/webhook \
  --print-secret \
  --latest
