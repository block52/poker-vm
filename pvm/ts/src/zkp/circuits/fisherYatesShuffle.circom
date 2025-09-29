pragma circom 2.0.0;

// Template to verify a single Fisher-Yates shuffle step
template FisherYatesStep() {
    // Inputs
    signal input cardA;    // Card at position i
    signal input cardB;    // Card at position j  
    signal input i;        // Current position
    signal input j;        // Random position (j = seed % (i + 1))
    signal input seed;     // Random seed value
    
    // Outputs
    signal output newCardA; // Card that will be at position i after swap
    signal output newCardB; // Card that will be at position j after swap
    signal output isValid; // 1 if the shuffle step is valid, 0 otherwise
    
    // Constraint: j must be in range [0, i]
    component lessThanOrEqual = LessEqThan(8); // 8 bits should be enough for deck size
    lessThanOrEqual.in[0] <== j;
    lessThanOrEqual.in[1] <== i;
    
    // Constraint: j should equal seed % (i + 1)
    component mod = Mod(8);
    mod.dividend <== seed;
    mod.divisor <== i + 1;
    
    signal seedModIPlusOne <== mod.remainder;
    
    // Check if j equals seed % (i + 1)
    component equalCheck = IsEqual();
    equalCheck.in[0] <== j;
    equalCheck.in[1] <== seedModIPlusOne;
    
    // Perform the swap
    newCardA <== cardB;
    newCardB <== cardA;
    
    // The step is valid if j is in range and equals seed % (i + 1)
    isValid <== lessThanOrEqual.out * equalCheck.out;
}

// Template for modulo operation
template Mod(n) {
    signal input dividend;
    signal input divisor;
    signal output quotient;
    signal output remainder;
    
    quotient <-- dividend \ divisor;
    remainder <-- dividend % divisor;
    
    // Constraints
    dividend === quotient * divisor + remainder;
    component lt = LessThan(n);
    lt.in[0] <== remainder;
    lt.in[1] <== divisor;
    lt.out === 1;
}

// Template for checking if two values are equal
template IsEqual() {
    signal input in[2];
    signal output out;
    
    signal diff <== in[0] - in[1];
    
    component isZero = IsZero();
    isZero.in <== diff;
    out <== isZero.out;
}

// Template for checking if a value is zero
template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <-- in != 0 ? 1 / in : 0;
    
    out <== -in * inv + 1;
    in * out === 0;
}

// Template for less than comparison
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    signal diff <== in[0] - in[1] + (1 << n);
    
    component num2Bits = Num2Bits(n + 1);
    num2Bits.in <== diff;
    
    out <== 1 - num2Bits.out[n];
}

// Template for less than or equal comparison
template LessEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1] + 1;
    out <== lt.out;
}

// Template to convert number to binary representation
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    
    var lc1 = 0;
    var e2 = 1;
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}

// Main template for verifying Fisher-Yates shuffle of a deck
template FisherYatesShuffle(deckSize) {
    // Private inputs (witness)
    signal private input originalDeck[deckSize];  // Original deck order
    signal private input seeds[deckSize];         // Random seeds for each step
    
    // Public inputs
    signal input shuffledDeck[deckSize];          // Final shuffled deck
    signal input seedHash;                        // Hash of all seeds (for commitment)
    
    // Outputs
    signal output isValidShuffle;                 // 1 if shuffle is valid, 0 otherwise
    
    // Working arrays to track deck state during shuffle
    signal deckState[deckSize + 1][deckSize];
    
    // Initialize first row with original deck
    for (var i = 0; i < deckSize; i++) {
        deckState[0][i] <== originalDeck[i];
    }
    
    // Verify each shuffle step
    signal validSteps[deckSize];
    
    for (var step = 0; step < deckSize - 1; step++) {
        var i = deckSize - 1 - step;  // Current position (going backwards)
        
        // Calculate j = seeds[step] % (i + 1)
        component mod = Mod(8);
        mod.dividend <== seeds[step];
        mod.divisor <== i + 1;
        signal j <== mod.remainder;
        
        // Verify this shuffle step
        component shuffleStep = FisherYatesStep();
        shuffleStep.cardA <== deckState[step][i];
        shuffleStep.cardB <== deckState[step][j];
        shuffleStep.i <== i;
        shuffleStep.j <== j;
        shuffleStep.seed <== seeds[step];
        
        validSteps[step] <== shuffleStep.isValid;
        
        // Update deck state for next iteration
        for (var pos = 0; pos < deckSize; pos++) {
            if (pos == i) {
                deckState[step + 1][pos] <== shuffleStep.newCardA;
            } else if (pos == j) {
                deckState[step + 1][pos] <== shuffleStep.newCardB;
            } else {
                deckState[step + 1][pos] <== deckState[step][pos];
            }
        }
    }
    
    // Last step doesn't need shuffling (i = 0)
    validSteps[deckSize - 1] <== 1;
    
    // Verify final deck matches expected shuffled deck
    signal finalDeckMatches[deckSize];
    for (var i = 0; i < deckSize; i++) {
        component eq = IsEqual();
        eq.in[0] <== deckState[deckSize - 1][i];
        eq.in[1] <== shuffledDeck[i];
        finalDeckMatches[i] <== eq.out;
    }
    
    // Verify all steps are valid
    signal allStepsValid;
    allStepsValid <== validSteps[0];
    for (var i = 1; i < deckSize; i++) {
        allStepsValid <== allStepsValid * validSteps[i];
    }
    
    // Verify final deck matches
    signal allFinalMatches;
    allFinalMatches <== finalDeckMatches[0];
    for (var i = 1; i < deckSize; i++) {
        allFinalMatches <== allFinalMatches * finalDeckMatches[i];
    }
    
    // Verify seed hash (simplified - in practice you'd use a proper hash function)
    component seedHashCheck = SeedHashVerifier(deckSize);
    seedHashCheck.seeds <== seeds;
    seedHashCheck.expectedHash <== seedHash;
    
    // Output is valid only if all conditions are met
    isValidShuffle <== allStepsValid * allFinalMatches * seedHashCheck.isValid;
}

// Template to verify seed hash (simplified version)
template SeedHashVerifier(deckSize) {
    signal input seeds[deckSize];
    signal input expectedHash;
    signal output isValid;
    
    // Simplified hash verification - in practice use SHA256 or Poseidon
    signal seedSum;
    seedSum <== seeds[0];
    for (var i = 1; i < deckSize; i++) {
        seedSum <== seedSum + seeds[i];
    }
    
    // Simple check - replace with proper hash verification
    component eq = IsEqual();
    eq.in[0] <== seedSum;
    eq.in[1] <== expectedHash;
    isValid <== eq.out;
}

// Instantiate the main component for a 52-card deck
component main = FisherYatesShuffle(52);