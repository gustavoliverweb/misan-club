#!/usr/bin/env bash
# Simulates a sale event from MDS to the local webhook endpoint.
# Usage:
#   MDS_WEBHOOK_SECRET=your_secret ./scripts/test-webhook.sh
#
# Override defaults with env vars:
#   BASE_URL=http://localhost:3000 MEMBER_EMAIL=alice@example.com ./scripts/test-webhook.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
SECRET="${MDS_WEBHOOK_SECRET:-dev-secret}"
ORDER_ID="MDS-$(date +%s)"

curl -s -X POST "${BASE_URL}/api/webhooks/mds" \
  -H "Content-Type: application/json" \
  -H "x-misan-signature: ${SECRET}" \
  -d "{
    \"external_order_id\": \"${ORDER_ID}\",
    \"member_email\": \"${MEMBER_EMAIL:-member1@example.com}\",
    \"net_amount\": 100,
    \"product_category\": \"nutrition\"
  }"
