# Shared Secret Key Exchange Analysis

This document analyzes the ECDH shared secret mechanism in `scripts/shuffle-demo.py` and evaluates whether Issue #132 (passing public key on join) is necessary.

## Overview

The demo implements **Elliptic Curve Diffie-Hellman (ECDH)** key exchange to derive a shared secret between poker players. This shared secret could theoretically be used to encrypt hole cards.

## How ECDH Key Exchange Works

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant P3 as Player 3
    participant PVM as PVM Server

    Note over P1,P3: Phase 1: Key Generation (on join)
    P1->>P1: Generate keypair (privKey1, pubKey1)
    P2->>P2: Generate keypair (privKey2, pubKey2)
    P3->>P3: Generate keypair (privKey3, pubKey3)

    Note over P1,PVM: Phase 2: Public Key Exchange
    P1->>PVM: Join table + pubKey1
    P2->>PVM: Join table + pubKey2
    P3->>PVM: Join table + pubKey3
    PVM->>P1: Broadcast all public keys
    PVM->>P2: Broadcast all public keys
    PVM->>P3: Broadcast all public keys

    Note over P1,P3: Phase 3: Shared Secret Derivation
    P1->>P1: ECDH(privKey1, pubKey2) XOR ECDH(privKey1, pubKey3)
    P2->>P2: ECDH(privKey2, pubKey1) XOR ECDH(privKey2, pubKey3)
    P3->>P3: ECDH(privKey3, pubKey1) XOR ECDH(privKey3, pubKey2)

    Note over P1,P3: All players derive SAME shared secret!
```

## The Math Behind It

```mermaid
flowchart TD
    subgraph "Player 1's Computation"
        A1[privKey1] --> B1[ECDH with pubKey2]
        A1 --> C1[ECDH with pubKey3]
        B1 --> D1[secret_1_2]
        C1 --> E1[secret_1_3]
        D1 --> F1[XOR]
        E1 --> F1
        F1 --> G1[Final Secret]
    end

    subgraph "Player 2's Computation"
        A2[privKey2] --> B2[ECDH with pubKey1]
        A2 --> C2[ECDH with pubKey3]
        B2 --> D2[secret_2_1 = secret_1_2]
        C2 --> E2[secret_2_3]
        D2 --> F2[XOR]
        E2 --> F2
        F2 --> G2[Final Secret]
    end

    G1 -.->|"Same Value!"| G2

    style G1 fill:#90EE90
    style G2 fill:#90EE90
```

## Code Breakdown

### 1. Key Generation (SECP256K1 - same curve as Bitcoin/Ethereum)

```python
def generate_keypair(self):
    private_key = ec.generate_private_key(ec.SECP256K1())
    public_key = private_key.public_key()
    return private_key, public_key
```

### 2. Shared Secret Derivation

```python
def derive_shared_secret(self, private_key, peer_public_key):
    # ECDH: shared_key = privKey * peerPubKey (elliptic curve multiplication)
    shared_key = private_key.exchange(ec.ECDH(), peer_public_key)

    # HKDF: Derive a uniform 32-byte key
    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        info=b'poker_game_shared_secret'
    ).derive(shared_key)

    return derived_key
```

### 3. Combining Multiple Players' Secrets

```python
def compute_shared_secret(self, other_players_keys):
    final_secret = b'\x00' * 32

    for player_id, key_bytes in other_players_keys.items():
        if player_id != self.player_id:
            peer_public_key = deserialize(key_bytes)
            shared_secret = self.derive_shared_secret(self.private_key, peer_public_key)
            # XOR combine
            final_secret = bytes(a ^ b for a, b in zip(final_secret, shared_secret))

    return final_secret
```

---

## Critical Question: Do We Need Issue #132?

### Can We Get the Public Key from Signed Messages?

**YES!** Ethereum/Cosmos signatures are **recoverable**.

```mermaid
flowchart LR
    subgraph "Current Flow"
        A[User Signs Tx] --> B[Signature + Message]
        B --> C[Broadcast to Chain]
    end

    subgraph "Public Key Recovery"
        B --> D[ecrecover]
        D --> E[Recover Public Key]
        E --> F[Derive Address]
    end

    style E fill:#FFD700
```

**We already do this!** In `query_game_state.go`:

```go
// We recover the public key from the signature to verify identity
recoveredPubKey, err := crypto.SigToPub(prefixedHash.Bytes(), signatureBytes)
```

### Where Public Keys Are Already Available

| Location | How We Get It |
|----------|---------------|
| Join Transaction | Recoverable from tx signature |
| WebSocket Auth | Recoverable from auth signature |
| Any Signed Action | Recoverable from action signature |

---

## My Assessment: Is Issue #132 Necessary?

```mermaid
flowchart TD
    Q1{What's the goal?}
    Q1 -->|Encrypt hole cards| A1[Shared Secret Needed]
    Q1 -->|Just identify players| A2[Already Have This!]

    A1 --> Q2{Who encrypts the cards?}
    Q2 -->|PVM Server| B1[Server sees cards anyway<br/>Shared secret pointless]
    Q2 -->|Mental Poker| B2[Need full protocol<br/>Much more complex]

    A2 --> C1[Use recovered pubkey<br/>from signatures]

    B1 --> D1[❌ Issue #132 Not Needed]
    B2 --> D2[⚠️ Issue #132 is just<br/>first step of many]
    C1 --> D3[✅ Already Solved]

    style D1 fill:#FFB6C1
    style D2 fill:#FFD700
    style D3 fill:#90EE90
```

## Recommendation

### Current Architecture (Trusted PVM Server)

The PVM server is a **trusted dealer** - it sees all cards. In this model:

- **Issue #132 is NOT necessary** - shared secrets don't help because the server already knows everything
- Public keys can be recovered from signatures when needed
- The demo is interesting but doesn't fit the architecture

### Future Architecture (Trustless Mental Poker)

If you want truly trustless poker where NO ONE sees the cards until revealed:

- Issue #132 would be just the **first of many steps**
- Would need full mental poker protocol (commutative encryption, ZK proofs)
- Much more complex than just sharing public keys

## Summary

| Question | Answer |
|----------|--------|
| Can we get pubkey from signature? | **Yes** - already do this |
| Does current architecture need shared secret? | **No** - PVM sees all cards anyway |
| Should we close Issue #132? | **Yes** - or re-scope for mental poker |
| Is the demo useful? | **Educational** - but not applicable to current design |

## If You Still Want Shared Secrets

If there's a specific use case (e.g., encrypted chat between players), you could:

1. **Option A**: Recover pubkey from first signed action (no code changes needed)
2. **Option B**: Add optional `publicKey` field to join message (Issue #132)
3. **Option C**: Full mental poker implementation (major undertaking)

---

*Generated for Issue #132 analysis*
