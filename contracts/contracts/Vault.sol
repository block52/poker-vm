// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC1363Receiver } from "./ERC1363/IERC1363Receiver.sol";
import { IValidator } from "./IValidator.sol";

contract Vault is IValidator, IERC1363Receiver {
    using ECDSA for bytes32;

    mapping(address => uint256) private _balances;
    mapping(address => uint256) private _lockTimes;

    address private immutable _underlying;
    uint256 private immutable _lockTime;
    uint256 private _minValidatorStake;
    uint256 private _validatorCount;

    constructor(address underlying_, uint256 lockTime_, uint256 minValidatorStake_) {
        _underlying = underlying_;
        _lockTime = lockTime_;
        uint256 decimals = IERC20Metadata(_underlying).decimals();
        _minValidatorStake = minValidatorStake_ * 10 ** decimals;
    }

    function balances(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lockTimes(address account) external view returns (uint256) {
        return _lockTimes[account];
    }

    function underlying() external view returns (address) {
        return _underlying;
    }

    function lockTime() external view returns (uint256) {
        return _lockTime;
    }

    function minValidatorStake() external view returns (uint256) {
        return _minValidatorStake;
    }

    function validatorCount() external view returns (uint256) {
        return _validatorCount;
    }

    function name() external view returns (string memory) {
        return IERC20Metadata(_underlying).name();
    }

    function isValidator(address account) external view returns (bool) {
        return _isValidator(account);
    }

    function _isValidator(address account) private view returns (bool) {
        if (account == address(0)) {
            return false;
        }

        return _balances[account] >= _minValidatorStake;
    }

    function stake(uint256 amount) external {
        IERC20 token = IERC20(_underlying);
        token.transferFrom(msg.sender, address(this), amount);

        _lockTimes[msg.sender] = block.timestamp + _lockTime;
        if (_isValidator(msg.sender) == false && _balances[msg.sender] + amount >= _minValidatorStake) {
            _validatorCount++;
        }
        _balances[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(_balances[msg.sender] >= amount, "withdraw: insufficient balance");
        require(block.timestamp >= _lockTimes[msg.sender], "withdraw: funds are locked");

        if (_isValidator(msg.sender) == true && _balances[msg.sender] - amount < _minValidatorStake) {
            _validatorCount--;
        }
        _balances[msg.sender] -= amount;

        IERC20 token = IERC20(_underlying);
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Wewe token approveAndCall
    function receiveApproval(address from, uint256 amount, address token, bytes calldata extraData) external {}

    function slash(address account, bytes32 proof) external {
        // address signer = ECDSA.recover(account, proof);
        // require(_isValidator(signer), "Bridge: invalid signature");

        // uint256 amount = balances[account];
        if (_isValidator(account) == true) {
            _validatorCount--;
        }
        _balances[account] = 0;
    }

    event Staked(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
}
