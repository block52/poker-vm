#!/bin/bash

# Script to verify b52 address prefix is correctly set up

echo "==================================="
echo "B52 Prefix Verification Script"
echo "==================================="
echo ""

# Check if pokerchaind binary exists
if ! command -v pokerchaind &> /dev/null; then
    echo "❌ pokerchaind binary not found"
    echo "   Run 'ignite chain build' first"
    exit 1
fi

echo "✅ pokerchaind binary found"
echo ""

# List keys and show addresses
echo "📋 Checking account addresses..."
echo ""

# Get Alice's address
ALICE_ADDR=$(pokerchaind keys show alice -a 2>/dev/null)
if [ ! -z "$ALICE_ADDR" ]; then
    if [[ $ALICE_ADDR == b52* ]]; then
        echo "✅ Alice's address: $ALICE_ADDR (correct prefix)"
    else
        echo "❌ Alice's address: $ALICE_ADDR (incorrect prefix - should start with b52)"
    fi
else
    echo "⚠️  Alice key not found (run 'ignite chain serve' to create)"
fi

# Get Bob's address
BOB_ADDR=$(pokerchaind keys show bob -a 2>/dev/null)
if [ ! -z "$BOB_ADDR" ]; then
    if [[ $BOB_ADDR == b52* ]]; then
        echo "✅ Bob's address: $BOB_ADDR (correct prefix)"
    else
        echo "❌ Bob's address: $BOB_ADDR (incorrect prefix - should start with b52)"
    fi
else
    echo "⚠️  Bob key not found (run 'ignite chain serve' to create)"
fi

echo ""
echo "==================================="
echo "Validation Details"
echo "==================================="
echo ""

# Check app.go for prefix configuration
if [ -f "app/app.go" ]; then
    echo "📄 Checking app/app.go configuration..."
    
    if grep -q 'AccountAddressPrefix = "b52"' app/app.go; then
        echo "✅ AccountAddressPrefix correctly set to 'b52' in app/app.go"
    else
        echo "❌ AccountAddressPrefix not found or incorrect in app/app.go"
        echo "   Expected: const AccountAddressPrefix = \"b52\""
    fi
    
    if grep -q 'SetBech32PrefixForAccount.*b52' app/app.go; then
        echo "✅ Bech32 prefix configuration found in app/app.go"
    else
        echo "⚠️  Bech32 prefix configuration not found in app/app.go"
    fi
else
    echo "⚠️  app/app.go not found"
fi

echo ""

# Check config.yml
if [ -f "config.yml" ]; then
    echo "📄 Checking config.yml..."
    
    if grep -q "address.*prefix.*b52" config.yml; then
        echo "✅ Address prefix mentioned in config.yml"
    else
        echo "ℹ️  Address prefix not explicitly mentioned in config.yml (this is normal)"
    fi
else
    echo "⚠️  config.yml not found"
fi

echo ""
echo "==================================="
echo "Testing Address Generation"
echo "==================================="
echo ""

# Generate a test key to verify prefix
TEST_KEY="test_verification_$(date +%s)"
echo "🔑 Generating test key: $TEST_KEY"

TEST_ADDR=$(pokerchaind keys add $TEST_KEY --output json 2>/dev/null | grep -o '"address":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TEST_ADDR" ]; then
    if [[ $TEST_ADDR == b52* ]]; then
        echo "✅ Test address: $TEST_ADDR"
        echo "✅ PREFIX VERIFICATION PASSED!"
    else
        echo "❌ Test address: $TEST_ADDR"
        echo "❌ PREFIX VERIFICATION FAILED - addresses should start with b52"
    fi
    
    # Clean up test key
    pokerchaind keys delete $TEST_KEY -y &>/dev/null
    echo "🧹 Test key cleaned up"
else
    echo "⚠️  Could not generate test key"
fi

echo ""
echo "==================================="
echo "Manual Verification Commands"
echo "==================================="
echo ""
echo "Run these commands to manually verify:"
echo ""
echo "  # List all keys with addresses"
echo "  pokerchaind keys list"
echo ""
echo "  # Show specific key address"
echo "  pokerchaind keys show alice -a"
echo ""
echo "  # Create a new key"
echo "  pokerchaind keys add newkey"
echo ""
echo "  # Check validator address format"
echo "  pokerchaind tendermint show-validator"
echo ""
echo "==================================="

# Summary
echo ""
echo "📊 Summary:"
if [[ $ALICE_ADDR == b52* ]] || [[ $BOB_ADDR == b52* ]] || [[ $TEST_ADDR == b52* ]]; then
    echo "✅ B52 address prefix is correctly configured!"
    echo ""
    echo "🎉 Your chain is using the b52 address prefix."
    echo "   All addresses will start with 'b52'"
else
    echo "❌ B52 address prefix may not be correctly configured"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Check app/app.go has: const AccountAddressPrefix = \"b52\""
    echo "   2. Verify SetConfig() function sets the prefix correctly"
    echo "   3. Rebuild with: ignite chain build"
    echo "   4. Reset chain: pokerchaind tendermint unsafe-reset-all"
    echo "   5. Restart: ignite chain serve"
fi

echo ""