// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC1363Receiver } from "./ERC1363/IERC1363Receiver.sol";
import { IValidator } from "./IValidator.sol";
import { IUniswapV3, ISwapRouter } from "./Uniswap/Interfaces.sol";

contract Vault is IValidator, IERC1363Receiver {
    using ECDSA for bytes32;

    mapping(uint256 => address) private _validators;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) private _lockTimes;

    address private immutable _underlying;
    uint256 private immutable _lockTime;
    uint256 private _minValidatorStake;
    uint256 private _validatorCount;
    address private router = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

    constructor(address underlying_, uint256 lockTime_, uint256 minValidatorStake_) {
        _underlying = underlying_;
        _lockTime = lockTime_ * 1 days;
        _minValidatorStake = minValidatorStake_;
    }

    function balanceOf(address account) external view returns (uint256) {
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

    function getValidatorAddress(uint256 index) external view returns (address) {

    }

    function name() external view returns (string memory) {
        string memory _name = IERC20Metadata(_underlying).symbol();
        return string.concat(_name, " Vault");
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
            _validators[_validatorCount] = msg.sender;
            _validatorCount++;
        }

        _balances[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function swapAndStake(uint256 amount, address token) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(router, amount);

        ISwapRouter swapRouter = ISwapRouter(router);
        
        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: token,
            tokenOut: _underlying,
            fee: 1000,
            recipient: address(this),
            amountIn: amount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        // The call to `exactInputSingle` executes the swap.
        uint256 amountOut = swapRouter.exactInputSingle(params);

        _lockTimes[msg.sender] = block.timestamp + _lockTime;
        if (_isValidator(msg.sender) == false && _balances[msg.sender] + amountOut >= _minValidatorStake) {
            _validatorCount++;
        }

        _balances[msg.sender] += amountOut;
        emit Staked(msg.sender, amountOut);
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

    function receiveApproval(address from, uint256 amount, address token, bytes calldata extraData) external {
        require(token == _underlying, "Vault: invalid token");

        IERC20(token).transferFrom(from, address(this), amount);

        _lockTimes[from] = block.timestamp + _lockTime;
        if (_isValidator(from) == false && _balances[from] + amount >= _minValidatorStake) {
            _validatorCount++;
        }
        _balances[from] += amount;

        emit Staked(from, amount);
    }

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
