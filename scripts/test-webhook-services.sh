#!/usr/bin/env bash
# Test Services webhook locally (Spec 05 §3.1).
# Usage:
#   ./scripts/test-webhook-services.sh
#   MEMBER_EMAIL=otro@mail.com COMMERCIAL_MARGIN=500 ./scripts/test-webhook-services.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
SECRET="${SERVICES_WEBHOOK_SECRET:-${MDS_WEBHOOK_SECRET:-dev-secret}}"
ORDER_ID="SVC-$(date +%s)"
EMAIL="${MEMBER_EMAIL:-member1@example.com}"
MARGIN="${COMMERCIAL_MARGIN:-200}"

echo "→ POST /api/webhooks/services"
echo "  order_id         : $ORDER_ID"
echo "  email            : $EMAIL"
echo "  commercial_margin: $MARGIN"
echo "  (seller credit)  : $(echo "$MARGIN * 0.7" | bc)  (70%)"
echo "  (network base)   : $(echo "$MARGIN * 0.3" | bc)  (30%)"
echo ""

curl -s -X POST "${BASE_URL}/api/webhooks/services" \
  -H "Content-Type: application/json" \
  -H "x-misan-signature: ${SECRET}" \
  -d "{
    \"external_order_id\": \"${ORDER_ID}\",
    \"member_email\": \"${EMAIL}\",
    \"commercial_margin\": ${MARGIN}
  }" | (command -v jq &>/dev/null && jq . || cat)
