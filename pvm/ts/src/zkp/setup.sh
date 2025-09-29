#!/bin/bash

# Fisher-Yates ZK Proof Circuit Setup Script
# This script sets up the circom circuit for zero-knowledge Fisher-Yates shuffle verification

set -e

echo "🔧 Setting up Fisher-Yates ZK Proof Circuit..."

# Configuration
CIRCUIT_NAME="fisherYatesShuffle"
ZKP_DIR="$(dirname "$0")"
BUILD_DIR="$ZKP_DIR/build"
CIRCUITS_DIR="$ZKP_DIR/circuits"
PTAU_SIZE=12  # Suitable for 52-card deck (2^12 = 4096 constraints should be enough)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 Step $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_step 1 "Checking dependencies..."
    
    if ! command -v circom &> /dev/null; then
        print_error "circom is not installed. Please install it first:"
        echo "  npm install -g circom"
        echo "  or visit: https://docs.circom.io/getting-started/installation/"
        exit 1
    fi
    
    if ! command -v snarkjs &> /dev/null; then
        print_error "snarkjs is not installed. Please install it first:"
        echo "  npm install -g snarkjs"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Create build directory
setup_directories() {
    print_step 2 "Setting up directories..."
    
    mkdir -p "$BUILD_DIR"
    print_success "Build directory created: $BUILD_DIR"
}

# Compile the circuit
compile_circuit() {
    print_step 3 "Compiling circuit..."
    
    cd "$BUILD_DIR"
    
    if circom "$CIRCUITS_DIR/$CIRCUIT_NAME.circom" --r1cs --wasm --sym -o .; then
        print_success "Circuit compiled successfully"
    else
        print_error "Circuit compilation failed"
        exit 1
    fi
}

# Setup Powers of Tau ceremony
setup_powers_of_tau() {
    print_step 4 "Setting up Powers of Tau ceremony..."
    
    cd "$BUILD_DIR"
    
    # Phase 1: Start ceremony
    if [ ! -f "pot${PTAU_SIZE}_0000.ptau" ]; then
        print_step "4a" "Starting Powers of Tau ceremony..."
        snarkjs powersoftau new bn128 $PTAU_SIZE pot${PTAU_SIZE}_0000.ptau -v
        print_success "Powers of Tau ceremony started"
    else
        print_warning "Powers of Tau file already exists, skipping..."
    fi
    
    # Phase 1: Contribute
    if [ ! -f "pot${PTAU_SIZE}_0001.ptau" ]; then
        print_step "4b" "Contributing to ceremony..."
        snarkjs powersoftau contribute pot${PTAU_SIZE}_0000.ptau pot${PTAU_SIZE}_0001.ptau \
            --name="First contribution" -v -e="$(date)"
        print_success "Contribution completed"
    else
        print_warning "Contribution file already exists, skipping..."
    fi
    
    # Phase 1: Prepare Phase 2
    if [ ! -f "pot${PTAU_SIZE}_final.ptau" ]; then
        print_step "4c" "Preparing Phase 2..."
        snarkjs powersoftau prepare phase2 pot${PTAU_SIZE}_0001.ptau pot${PTAU_SIZE}_final.ptau -v
        print_success "Phase 2 preparation completed"
    else
        print_warning "Final Powers of Tau file already exists, skipping..."
    fi
}

# Generate proving and verification keys
generate_keys() {
    print_step 5 "Generating proving and verification keys..."
    
    cd "$BUILD_DIR"
    
    # Phase 2: Setup
    if [ ! -f "${CIRCUIT_NAME}_0000.zkey" ]; then
        print_step "5a" "Setting up circuit..."
        snarkjs groth16 setup ${CIRCUIT_NAME}.r1cs pot${PTAU_SIZE}_final.ptau ${CIRCUIT_NAME}_0000.zkey
        print_success "Circuit setup completed"
    else
        print_warning "Circuit setup file already exists, skipping..."
    fi
    
    # Phase 2: Contribute
    if [ ! -f "${CIRCUIT_NAME}_final.zkey" ]; then
        print_step "5b" "Contributing to circuit..."
        snarkjs zkey contribute ${CIRCUIT_NAME}_0000.zkey ${CIRCUIT_NAME}_final.zkey \
            --name="1st Contributor" -v -e="$(date)"
        print_success "Circuit contribution completed"
    else
        print_warning "Final proving key already exists, skipping..."
    fi
    
    # Export verification key
    if [ ! -f "verification_key.json" ]; then
        print_step "5c" "Exporting verification key..."
        snarkjs zkey export verificationkey ${CIRCUIT_NAME}_final.zkey verification_key.json
        print_success "Verification key exported"
    else
        print_warning "Verification key already exists, skipping..."
    fi
}

# Verify the setup
verify_setup() {
    print_step 6 "Verifying setup..."
    
    cd "$BUILD_DIR"
    
    # Check if all required files exist
    required_files=(
        "${CIRCUIT_NAME}.wasm"
        "${CIRCUIT_NAME}_final.zkey"
        "verification_key.json"
        "${CIRCUIT_NAME}.r1cs"
    )
    
    all_files_exist=true
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Missing file: $file"
            all_files_exist=false
        fi
    done
    
    if [ "$all_files_exist" = true ]; then
        print_success "All required files are present"
        echo ""
        echo "📁 Generated files:"
        for file in "${required_files[@]}"; do
            echo "  - $file"
        done
    else
        print_error "Setup verification failed"
        exit 1
    fi
}

# Generate a test proof
generate_test_proof() {
    print_step 7 "Generating test proof..."
    
    cd "$BUILD_DIR"
    
    # Create test input
    cat > test_input.json << EOF
{
    "originalDeck": $(seq 0 51 | jq -s .),
    "seeds": $(seq 1 52 | jq -s .),
    "shuffledDeck": $(seq 0 51 | shuf | jq -s .),
    "seedHash": 12345
}
EOF
    
    # Generate witness
    if node ${CIRCUIT_NAME}_js/generate_witness.js ${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm test_input.json witness.wtns; then
        print_success "Witness generated"
    else
        print_error "Witness generation failed"
        return 1
    fi
    
    # Generate proof
    if snarkjs groth16 prove ${CIRCUIT_NAME}_final.zkey witness.wtns proof.json public.json; then
        print_success "Test proof generated successfully"
    else
        print_error "Test proof generation failed"
        return 1
    fi
    
    # Verify proof
    if snarkjs groth16 verify verification_key.json public.json proof.json; then
        print_success "Test proof verification passed"
    else
        print_error "Test proof verification failed"
        return 1
    fi
}

# Show usage instructions
show_usage() {
    echo ""
    echo "🎉 Fisher-Yates ZK Proof Circuit Setup Complete!"
    echo ""
    echo "📋 To use the circuit in your application:"
    echo "  1. Install snarkjs in your project: npm install snarkjs"
    echo "  2. Import the ZKShuffleCommand or FisherYatesZKProof classes"
    echo "  3. Use the generated files in $BUILD_DIR"
    echo ""
    echo "🔧 Generated files:"
    echo "  - ${CIRCUIT_NAME}.wasm: WebAssembly for witness generation"
    echo "  - ${CIRCUIT_NAME}_final.zkey: Proving key"
    echo "  - verification_key.json: Verification key"
    echo "  - ${CIRCUIT_NAME}.r1cs: R1CS constraint system"
    echo ""
    echo "📖 For more information, see the documentation in zkProof.ts"
}

# Main execution
main() {
    echo "🚀 Fisher-Yates Zero-Knowledge Proof Circuit Setup"
    echo "=================================================="
    
    check_dependencies
    setup_directories
    compile_circuit
    setup_powers_of_tau
    generate_keys
    verify_setup
    
    if [ "$1" = "--test" ]; then
        generate_test_proof
    fi
    
    show_usage
}

# Run with all arguments
main "$@"