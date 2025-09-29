// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IVerifier.sol";

/**
 * @title ShuffleVerifier
 * @dev Smart contract for verifying Fisher-Yates shuffle zero-knowledge proofs
 * Implements slashing mechanism for invalid proofs
 */
contract ShuffleVerifier {
    // Events
    event ShuffleVerified(
        address indexed dealer,
        bytes32 indexed gameId,
        bytes32 commitmentHash,
        uint256 timestamp
    );
    
    event ShuffleSlashed(
        address indexed dealer,
        bytes32 indexed gameId,
        uint256 slashedAmount,
        string reason,
        uint256 timestamp
    );
    
    event StakeDeposited(address indexed dealer, uint256 amount);
    event StakeWithdrawn(address indexed dealer, uint256 amount);
    
    // Structs
    struct ShuffleCommitment {
        address dealer;
        bytes32 gameId;
        bytes32 commitmentHash;
        uint256 timestamp;
        bool verified;
        bool challenged;
    }
    
    struct DealerStake {
        uint256 amount;
        uint256 lockedUntil;
        uint256 totalSlashed;
        bool active;
    }
    
    // State variables
    IVerifier public immutable verifier;
    
    // Minimum stake required to be a dealer
    uint256 public constant MIN_DEALER_STAKE = 1000 ether; // 1000 tokens
    
    // Slash amount for invalid proofs
    uint256 public constant SLASH_AMOUNT = 100 ether; // 100 tokens
    
    // Lock period after slashing (7 days)
    uint256 public constant LOCK_PERIOD = 7 days;
    
    // Challenge period (1 hour)
    uint256 public constant CHALLENGE_PERIOD = 1 hours;
    
    // Mappings
    mapping(address => DealerStake) public dealerStakes;
    mapping(bytes32 => ShuffleCommitment) public shuffleCommitments;
    mapping(address => bytes32[]) public dealerCommitments;
    
    // Contract owner
    address public owner;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyActiveDealer() {
        require(dealerStakes[msg.sender].active, "Not an active dealer");
        require(dealerStakes[msg.sender].amount >= MIN_DEALER_STAKE, "Insufficient stake");
        _;
    }
    
    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
        owner = msg.sender;
    }
    
    /**
     * @dev Deposit stake to become a dealer
     */
    function depositStake() external payable {
        require(msg.value > 0, "Must deposit some amount");
        
        DealerStake storage stake = dealerStakes[msg.sender];
        stake.amount += msg.value;
        
        if (stake.amount >= MIN_DEALER_STAKE) {
            stake.active = true;
        }
        
        emit StakeDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw stake (only if not locked and sufficient remaining)
     */
    function withdrawStake(uint256 amount) external {
        DealerStake storage stake = dealerStakes[msg.sender];
        require(stake.amount >= amount, "Insufficient stake balance");
        require(block.timestamp >= stake.lockedUntil, "Stake is locked");
        
        // Must maintain minimum stake if active
        if (stake.active) {
            require(stake.amount - amount >= MIN_DEALER_STAKE, "Would fall below minimum stake");
        }
        
        stake.amount -= amount;
        
        if (stake.amount < MIN_DEALER_STAKE) {
            stake.active = false;
        }
        
        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Submit a shuffle commitment (hash of shuffle proof)
     */
    function submitShuffleCommitment(
        bytes32 gameId,
        bytes32 commitmentHash
    ) external onlyActiveDealer {
        bytes32 commitmentId = keccak256(abi.encodePacked(msg.sender, gameId, block.timestamp));
        
        shuffleCommitments[commitmentId] = ShuffleCommitment({
            dealer: msg.sender,
            gameId: gameId,
            commitmentHash: commitmentHash,
            timestamp: block.timestamp,
            verified: false,
            challenged: false
        });
        
        dealerCommitments[msg.sender].push(commitmentId);
        
        emit ShuffleVerified(msg.sender, gameId, commitmentHash, block.timestamp);
    }
    
    /**
     * @dev Verify a shuffle proof
     */
    function verifyShuffleProof(
        bytes32 commitmentId,
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[1] memory publicSignals
    ) external {
        ShuffleCommitment storage commitment = shuffleCommitments[commitmentId];
        require(commitment.dealer != address(0), "Commitment does not exist");
        require(!commitment.verified, "Already verified");
        require(block.timestamp <= commitment.timestamp + CHALLENGE_PERIOD, "Challenge period expired");
        
        // Verify the zero-knowledge proof
        bool proofValid = verifier.verifyProof(_pA, _pB, _pC, publicSignals);
        
        if (proofValid) {
            // Proof is valid - mark as verified
            commitment.verified = true;
            emit ShuffleVerified(commitment.dealer, commitment.gameId, commitment.commitmentHash, block.timestamp);
        } else {
            // Proof is invalid - slash the dealer
            _slashDealer(commitment.dealer, commitmentId, "Invalid shuffle proof");
        }
    }
    
    /**
     * @dev Challenge a shuffle commitment (anyone can challenge)
     */
    function challengeShuffle(
        bytes32 commitmentId,
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[1] memory publicSignals
    ) external {
        ShuffleCommitment storage commitment = shuffleCommitments[commitmentId];
        require(commitment.dealer != address(0), "Commitment does not exist");
        require(!commitment.verified, "Already verified");
        require(!commitment.challenged, "Already challenged");
        require(block.timestamp <= commitment.timestamp + CHALLENGE_PERIOD, "Challenge period expired");
        
        commitment.challenged = true;
        
        // Verify the proof
        bool proofValid = verifier.verifyProof(_pA, _pB, _pC, publicSignals);
        
        if (!proofValid) {
            // Proof is invalid - slash the dealer
            _slashDealer(commitment.dealer, commitmentId, "Failed challenge verification");
        } else {
            // Proof is valid but was challenged - mark as verified
            commitment.verified = true;
            emit ShuffleVerified(commitment.dealer, commitment.gameId, commitment.commitmentHash, block.timestamp);
        }
    }
    
    /**
     * @dev Internal function to slash a dealer
     */
    function _slashDealer(address dealer, bytes32 commitmentId, string memory reason) internal {
        DealerStake storage stake = dealerStakes[dealer];
        
        uint256 slashAmount = SLASH_AMOUNT;
        if (stake.amount < slashAmount) {
            slashAmount = stake.amount;
        }
        
        stake.amount -= slashAmount;
        stake.totalSlashed += slashAmount;
        stake.lockedUntil = block.timestamp + LOCK_PERIOD;
        
        // Deactivate if stake falls below minimum
        if (stake.amount < MIN_DEALER_STAKE) {
            stake.active = false;
        }
        
        ShuffleCommitment storage commitment = shuffleCommitments[commitmentId];
        emit ShuffleSlashed(dealer, commitment.gameId, slashAmount, reason, block.timestamp);
        
        // Transfer slashed amount to contract owner (could be treasury)
        if (slashAmount > 0) {
            payable(owner).transfer(slashAmount);
        }
    }
    
    /**
     * @dev Get dealer information
     */
    function getDealerInfo(address dealer) external view returns (
        uint256 stake,
        uint256 lockedUntil,
        uint256 totalSlashed,
        bool active,
        uint256 commitmentCount
    ) {
        DealerStake memory dealerStake = dealerStakes[dealer];
        return (
            dealerStake.amount,
            dealerStake.lockedUntil,
            dealerStake.totalSlashed,
            dealerStake.active,
            dealerCommitments[dealer].length
        );
    }
    
    /**
     * @dev Get commitment information
     */
    function getCommitmentInfo(bytes32 commitmentId) external view returns (
        address dealer,
        bytes32 gameId,
        bytes32 commitmentHash,
        uint256 timestamp,
        bool verified,
        bool challenged
    ) {
        ShuffleCommitment memory commitment = shuffleCommitments[commitmentId];
        return (
            commitment.dealer,
            commitment.gameId,
            commitment.commitmentHash,
            commitment.timestamp,
            commitment.verified,
            commitment.challenged
        );
    }
    
    /**
     * @dev Get dealer's commitments
     */
    function getDealerCommitments(address dealer) external view returns (bytes32[] memory) {
        return dealerCommitments[dealer];
    }
    
    /**
     * @dev Emergency function to update minimum stake (owner only)
     */
    function updateMinStake(uint256 newMinStake) external onlyOwner {
        // Could emit an event and update MIN_DEALER_STAKE if it wasn't immutable
        // For now, this is a placeholder for governance functionality
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fallback function to receive Ether
     */
    receive() external payable {
        // Allow contract to receive Ether for staking
    }
}