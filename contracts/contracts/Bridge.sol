// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IValidator } from "./Vault.sol";
import { IOracle } from "./Oracle.sol";

contract Bridge {

    using ECDSA for bytes32;

    address public immutable underlying;
    address public immutable vault;
    address private immutable oracle;
    address private immutable _self;
    uint256 public immutable lockTime;

    mapping(address => uint256) public lockTimes;
    mapping(address => uint256) public balances;
    mapping(bytes32 => bool) private usedNonces;

    constructor(address _underlying, address _vault, addres _oracle, uint256 _lockTime) {
        underlying = _underlying;
        vault = _vault;
        oracle = _oracle;
        _self = address(this);
        lockTime = _lockTime;
    }

    function deposit(uint256 amount) external {
        IERC20 token = IERC20(underlying);

        lockTimes[msg.sender] += block.timestamp + lockTime;
        token.transferFrom(msg.sender, _self, amount);
        
        // Get exchange rate from oracle
        uint256 rate = IOracle(oracle).getExchangeRate(underlying);
        balances[msg.sender] += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount, address to, bytes32 nonce, bytes32 signature) external {
        require(!usedNonces[nonce], "Bridge: nonce already used");
        require(lockTimes[to] >= block.timestamp, "Bridge: funds are locked");
        require(balanceOf(to) >= amount, "Bridge: insufficient balance");

        bytes32 message = keccak256(abi.encodePacked(to, amount, nonce));
        address signer = ECDSA.recover(message, signature);
        require(IValidator(validator).isValidator(signer), "Bridge: invalid signature");

        balances[to] -= amount;
        IERC20 token = IERC20(underlying);
        token.transfer(to, amount);

        emit Withdrawn(to, amount);
    }

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
}