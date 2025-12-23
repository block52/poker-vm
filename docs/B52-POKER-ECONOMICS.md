# B52 Poker Economics

> **For**: Poker Players, Club Operators, Game Hosts
> **Network**: Block52 Decentralized Poker

---

## How It Works

Block52 is a decentralized poker network. Instead of one company running the games and taking rake, the network is run by 52 independent validators who share the fees. Anyone can earn a piece of the action by staking B52 tokens.

---

## The Rake Structure

### Traditional Online Poker vs Block52

```mermaid
flowchart LR
    subgraph "Traditional Poker Site"
        T1[Player Wins $1000 Pot]
        T2[Site Takes 5% Rake = $50]
        T3[Site Keeps Everything]
        T1 --> T2 --> T3
    end

    subgraph "Block52 Network"
        B1[Player Wins $1000 Pot]
        B2[Club Takes 5% Rake = $50]
        B3[Network Fee: 2-5% of Rake]
        B4[Club Keeps: $48-49]
        B5[Network Fee: $1-2.50]
        B1 --> B2
        B2 --> B4
        B2 --> B3 --> B5
    end
```

### Where Does the Network Fee Go?

The small network fee (percentage of rake) pays for running a decentralized, cheat-proof poker network.

```mermaid
pie title "Network Fee Distribution"
    "Validators (Run the Network)" : 40
    "Stakers (Token Holders)" : 30
    "Development (New Features)" : 20
    "Treasury (Reserves)" : 10
```

---

## For Players: Earn While You Play

### Stake B52, Get Rakeback

When you stake B52 tokens, you earn a share of ALL network fees - not just from your games, but from every game on the network.

```mermaid
flowchart TB
    subgraph "You"
        Stake["Stake 10,000 B52"]
        Play["Play Poker"]
    end

    subgraph "Network Activity"
        AllGames["All Games on Network<br/>$1M/month in pots"]
        AllRake["Total Rake: $50K"]
        NetFee["Network Fees: $1.5K"]
    end

    subgraph "Your Earnings"
        Share["Your Share of Fees<br/>(proportional to stake)"]
        Plus["+ Reduced Rake at Tables"]
    end

    Stake --> Share
    Play --> Plus
    AllGames --> AllRake --> NetFee --> Share
```

### Player Staking Tiers

| Stake Amount | Rake Reduction | Network Fee Share | Other Benefits |
|--------------|----------------|-------------------|----------------|
| 1,000+ B52 | 25% off | Yes | Basic rewards |
| 25,000+ B52 | 35% off | Yes | Priority support |
| 50,000+ B52 | 50% off | Yes | Premium features |

**The more you stake, the less rake you pay.**

---

## For Club Operators: Run Your Own Club

### Club Economics

As a club operator on Block52, you set your own rake and keep most of it. The network only takes a small cut for providing the infrastructure.

```mermaid
flowchart TB
    subgraph "Your Club"
        Tables["Your Tables"]
        Players["Your Players"]
        Rake["You Set Rake: 2-5%"]
    end

    subgraph "Example: $100K Monthly Action"
        Pots["Total Pots: $100,000"]
        YourRake["Your Rake (5%): $5,000"]
        NetFee["Network Fee (3%): $150"]
        YouKeep["You Keep: $4,850"]
    end

    Tables --> Players --> Pots
    Pots --> YourRake
    YourRake --> NetFee
    YourRake --> YouKeep
```

### What You Get

- **Your brand, your players, your rake**
- Provably fair shuffling (players can verify)
- No chargebacks (crypto settlements)
- Global player pool (no geo restrictions)
- 24/7 uptime (decentralized network)

### Club Operator Staking

Stake 25,000+ B52 to unlock club operator features:

```mermaid
flowchart LR
    subgraph "Requirements"
        Stake["25,000 B52 Staked"]
        Lock["3-month minimum"]
    end

    subgraph "You Get"
        Deploy["Deploy custom tables"]
        Brand["Your branding"]
        Rake["Set your own rake"]
        Analytics["Player analytics"]
        Support["Priority support"]
    end

    Stake --> Deploy & Brand & Rake & Analytics & Support
    Lock --> Deploy
```

---

## For Investors: Own the Network

### The B52 Value Proposition

Owning B52 tokens = Owning a piece of every poker game on the network.

```mermaid
flowchart TB
    subgraph "52 Million B52 = 100% of Network Fees"
        Supply["Fixed Supply: 52,000,000 B52"]
    end

    subgraph "Network Grows"
        Tables["More Tables"]
        Players["More Players"]
        Volume["More Volume"]
        Rake["More Rake"]
        Fees["More Network Fees"]
    end

    subgraph "Your Tokens"
        Hold["Hold 520,000 B52 = 1%"]
        Earn["Earn 1% of All Fees"]
    end

    Tables --> Players --> Volume --> Rake --> Fees
    Supply --> Hold --> Earn
    Fees --> Earn
```

### Passive Income Example

```mermaid
flowchart LR
    subgraph "Monthly Network Activity"
        Vol["$10M in Pots"]
        Rake["$500K Rake (5% avg)"]
        Net["$15K Network Fees (3%)"]
    end

    subgraph "You Own 1% (520K B52)"
        YourShare["$150/month"]
        APY["~3.5% APY on stake value"]
    end

    Vol --> Rake --> Net --> YourShare
```

*Note: Returns scale with network activity. More games = more fees = higher returns.*

---

## The Rake Flow: Complete Picture

```mermaid
flowchart TB
    subgraph "The Game"
        Hand["Hand Played"]
        Pot["Pot: $500"]
        Winner["Winner Takes: $475"]
        Rake["Rake: $25 (5%)"]
    end

    subgraph "Club Level"
        ClubRake["Club Receives: $25"]
        ClubKeeps["Club Keeps: $24.25"]
        NetFee["Network Fee: $0.75 (3%)"]
    end

    subgraph "Network Level"
        Validators["Validators: $0.30 (40%)"]
        Stakers["All Stakers: $0.225 (30%)"]
        Dev["Development: $0.15 (20%)"]
        Treasury["Treasury: $0.075 (10%)"]
    end

    subgraph "Back to Players"
        Rewards["Staking Players<br/>Earn Share"]
        Discount["Staking Players<br/>Pay Less Rake"]
    end

    Hand --> Pot
    Pot --> Winner
    Pot --> Rake
    Rake --> ClubRake
    ClubRake --> ClubKeeps
    ClubRake --> NetFee
    NetFee --> Validators & Stakers & Dev & Treasury
    Stakers --> Rewards
    Rewards --> Discount
```

---

## Staking: Validator vs Delegation

### Option 1: Run a Validator Node (High Commitment)

For serious operators who want maximum rewards.

| Requirement | Details |
|-------------|---------|
| Stake | 100,000+ B52 |
| Hardware | Dedicated server, 99.9% uptime |
| Technical | Run node software |
| Rewards | Highest tier + block rewards |

### Option 2: Delegate to a Validator (Easy)

For players and investors who just want passive income.

```mermaid
flowchart LR
    You["You: 10,000 B52"] --> |"Delegate"| Val["Validator Node"]
    Val --> |"Earns Fees"| Pool["Fee Pool"]
    Pool --> |"Your Share<br/>(minus commission)"| You
```

| Requirement | Details |
|-------------|---------|
| Stake | 1,000+ B52 minimum |
| Hardware | None |
| Technical | Just click delegate |
| Rewards | Proportional share minus validator commission |

---

## Why Decentralized Poker?

### The Problem with Traditional Sites

```mermaid
flowchart TB
    subgraph "Traditional Online Poker"
        Central["Centralized Server"]
        RNG["They Control RNG"]
        Funds["They Hold Your Funds"]
        Rules["They Set All Rules"]
        Trust["You Must Trust Them"]
    end

    subgraph "Risks"
        Cheat["Insider Cheating?"]
        Rug["Site Shuts Down?"]
        Freeze["Account Frozen?"]
        Rigged["Is RNG Fair?"]
    end

    Central --> Cheat & Rug & Freeze & Rigged
    RNG --> Rigged
    Funds --> Rug & Freeze
    Rules --> Cheat
    Trust --> Cheat & Rug & Freeze & Rigged
```

### Block52 Solution

```mermaid
flowchart TB
    subgraph "Block52 Network"
        Nodes["52 Independent Validators"]
        VRF["Verifiable Random Shuffling"]
        Self["Self-Custody Funds"]
        Open["Open Source Rules"]
        Verify["Anyone Can Verify"]
    end

    subgraph "Benefits"
        Fair["Provably Fair"]
        Safe["Your Keys, Your Chips"]
        Transparent["100% Transparent"]
        Decentralized["No Single Point of Failure"]
    end

    Nodes --> Decentralized
    VRF --> Fair
    Self --> Safe
    Open --> Transparent
    Verify --> Fair & Transparent
```

---

## Quick Reference

| Term | Meaning |
|------|---------|
| **B52** | Network token for staking & governance |
| **b52USDC** | Playing chips (1:1 with USDC) |
| **Rake** | % taken from pot by club |
| **Network Fee** | Small % of rake that goes to network |
| **Staking** | Locking B52 to earn network fees |
| **Delegation** | Staking with a validator (no hardware needed) |
| **Validator** | Node operator who runs the network |

---

## Get Started

1. **Get B52 tokens** - [Exchange TBD]
2. **Stake or Delegate** - Earn passive income from all games
3. **Play poker** - Use b52USDC at any table
4. **Run a club** - Stake 25K+ B52 to deploy your own tables

---

*Document Version: Draft 1.0*
*Last Updated: December 2024*
*For: Poker Community*
