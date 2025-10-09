#!/bin/bash

# Environment Variable Verification Script
# This script helps verify that environment variables are properly formatted
# Run this before deploying to production

echo "🔍 Piktor Environment Variable Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

echo "✅ Found .env.local file"
echo ""

# Function to check for whitespace issues
check_whitespace() {
    local var_name=$1
    local var_value=$2

    if [[ "$var_value" =~ ^[[:space:]] ]] || [[ "$var_value" =~ [[:space:]]$ ]]; then
        echo -e "${YELLOW}⚠️  $var_name has leading or trailing whitespace${NC}"
        return 1
    fi

    if [[ "$var_value" =~ $'\r' ]] || [[ "$var_value" =~ $'\n' ]] || [[ "$var_value" =~ $'\t' ]]; then
        echo -e "${RED}❌ $var_name contains invalid characters (newlines/tabs/carriage returns)${NC}"
        return 1
    fi

    return 0
}

# Function to validate Stripe key format
check_stripe_key() {
    local key_type=$1
    local key_value=$2
    local expected_prefix=$3

    if [[ ! "$key_value" =~ ^$expected_prefix ]]; then
        echo -e "${RED}❌ $key_type should start with $expected_prefix${NC}"
        return 1
    fi

    return 0
}

# Check Stripe variables
echo "📊 Checking Stripe Configuration..."
echo "-----------------------------------"

if grep -q "STRIPE_SECRET_KEY=" .env.local; then
    STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d'=' -f2-)

    if check_whitespace "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"; then
        if check_stripe_key "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "sk_"; then
            echo -e "${GREEN}✅ STRIPE_SECRET_KEY format is valid${NC}"
        fi
    fi
else
    echo -e "${RED}❌ STRIPE_SECRET_KEY not found${NC}"
fi

if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local; then
    STRIPE_PUB_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d'=' -f2-)

    if check_whitespace "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUB_KEY"; then
        if check_stripe_key "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUB_KEY" "pk_"; then
            echo -e "${GREEN}✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format is valid${NC}"
        fi
    fi
else
    echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found${NC}"
fi

if grep -q "STRIPE_WEBHOOK_SECRET=" .env.local; then
    STRIPE_WEBHOOK=$(grep "^STRIPE_WEBHOOK_SECRET=" .env.local | cut -d'=' -f2-)

    if check_whitespace "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK"; then
        if check_stripe_key "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK" "whsec_"; then
            echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET format is valid${NC}"
        fi
    fi
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET not found${NC}"
fi

echo ""

# Check Supabase variables
echo "🗄️  Checking Supabase Configuration..."
echo "---------------------------------------"

if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local; then
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2-)

    if check_whitespace "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"; then
        if [[ "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
            echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL format is valid${NC}"
        else
            echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SUPABASE_URL format looks unusual${NC}"
        fi
    fi
else
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not found${NC}"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
    SUPABASE_ANON=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2-)

    if check_whitespace "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON"; then
        if [[ "$SUPABASE_ANON" =~ ^eyJ ]]; then
            echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY format is valid${NC}"
        else
            echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY should be a JWT token${NC}"
        fi
    fi
else
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found${NC}"
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env.local; then
    SUPABASE_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2-)

    if check_whitespace "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE"; then
        if [[ "$SUPABASE_SERVICE" =~ ^eyJ ]]; then
            echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY format is valid${NC}"
        else
            echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY should be a JWT token${NC}"
        fi
    fi
else
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not found${NC}"
fi

echo ""

# Check Admin configuration
echo "👤 Checking Admin Configuration..."
echo "-----------------------------------"

if grep -q "ADMIN_USER_IDS=" .env.local; then
    ADMIN_IDS=$(grep "^ADMIN_USER_IDS=" .env.local | cut -d'=' -f2-)

    if check_whitespace "ADMIN_USER_IDS" "$ADMIN_IDS"; then
        IFS=',' read -ra IDS <<< "$ADMIN_IDS"
        echo -e "${GREEN}✅ ADMIN_USER_IDS found with ${#IDS[@]} admin user(s)${NC}"

        for id in "${IDS[@]}"; do
            # Validate UUID format
            if [[ "$id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
                echo "   - ${id:0:8}... ✓"
            else
                echo -e "   - ${RED}Invalid UUID format: $id${NC}"
            fi
        done
    fi
else
    echo -e "${YELLOW}⚠️  ADMIN_USER_IDS not configured (optional)${NC}"
fi

echo ""
echo "=========================================="
echo "📋 Verification Complete"
echo ""
echo "Next steps:"
echo "1. Fix any issues shown above in your .env.local"
echo "2. Update the same variables in Vercel Dashboard"
echo "3. Ensure you copy keys directly without intermediate text editors"
echo "4. Redeploy after updating Vercel environment variables"
echo ""
echo "To update Vercel environment variables:"
echo "https://vercel.com/your-team/piktor/settings/environment-variables"
