#!/usr/bin/env bash
# Test MDS webhook locally.
# Usage:
#   ./scripts/test-webhook.sh
#   MEMBER_EMAIL=otro@mail.com CATEGORY=proprietary NET_AMOUNT=200 ./scripts/test-webhook.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
SECRET="${MDS_WEBHOOK_SECRET:-dev-secret}"
ORDER_ID="MDS-$(date +%s)"
EMAIL="${MEMBER_EMAIL:-member1@example.com}"
CATEGORY="${CATEGORY:-standard}"
AMOUNT="${NET_AMOUNT:-100}"

echo "→ POST /api/webhooks/mds"
echo "  order_id : $ORDER_ID"
echo "  email    : $EMAIL"
echo "  category : $CATEGORY"
echo "  amount   : $AMOUNT"
echo ""

curl -s -X POST "${BASE_URL}/api/webhooks/mds" \
  -H "Content-Type: application/json" \
  -H "x-misan-signature: ${SECRET}" \
  -d "{
    \"external_order_id\": \"${ORDER_ID}\",
    \"member_email\": \"${EMAIL}\",
    \"net_amount\": ${AMOUNT},
    \"category\": \"${CATEGORY}\"
  }" | (command -v jq &>/dev/null && jq . || cat)
