// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IValidator } from "./Vault.sol";
import { IUniswapV3, ISwapRouter } from "./uniswap/Interfaces.sol";

contract Bridge is Ownable {
    struct Deposit {
        address account;
        uint256 amount;
    }

    address public immutable underlying;
    address public immutable vault;
    address public immutable router;
    uint256 public totalDeposits;
    address private immutable _self;

    mapping(bytes32 => bool) private usedNonces;
    mapping(uint256 => Deposit) public deposits;
    uint256 public depositIndex;

    function decimals() external view returns (uint8) {
        return IERC20Metadata(underlying).decimals();
    }

    function symbol() external view returns (string memory) {
        return string.concat(IERC20Metadata(underlying).symbol(), "b");
    }

    function name() external view returns (string memory) {
        return string.concat(IERC20Metadata(underlying).name(), " Bridge");
    }

    function totalSupply() external view returns (uint256) {
        return IERC20(underlying).balanceOf(_self);
    }

    constructor(address underlying_, address vault_, address router_) {
        underlying = underlying_;
        vault = vault_;
        router = router_;
        _self = address(this);

        IERC20(underlying).approve(_self, type(uint256).max);
    }

    function deposit(uint256 amount, address receiver, address token) external returns(uint256) {
        (index, received) = _deposit(amount, receiver, token);
        emit Deposited(receiver, received, index);

        return index;
    }

    function depositUnderlying(uint256 amount) external returns(uint256) {
        (index, received) = _deposit(amount, msg.sender, underlying);
        emit Deposited(msg.sender, received, index);

        return index;
    }

    function _deposit(uint256 amount, address receiver, address token) private returns (uint256 index, uint256 received) {
        IERC20(token).transferFrom(receiver, _self, amount);
        received = amount;

        if (_router != address(0) && token != underlying) {
            received = _swap(token, underlying, _self, amount, 0);
        }

        totalDeposits += received;

        deposits[depositIndex] = Deposit(receiver, received);
        depositIndex++;
        index = depositIndex;
    }

    function withdraw(uint256 amount, address receiver, bytes32 nonce, bytes calldata signature) external {
        require(!usedNonces[nonce], "withdraw: nonce already used");
        require(IERC20(underlying).balanceOf(_self) >= amount, "withdraw: insufficient balance");

        bytes32 messageHash = keccak256(abi.encodePacked(receiver, amount, nonce));
        address signer = recoverSignerAddress(getEthSignedMessageHash(messageHash), signature);

        require(IValidator(vault).isValidator(signer), "withdraw: invalid signature");

        usedNonces[nonce] = true;
        totalDeposits -= amount;

        IERC20 token = IERC20(underlying);
        token.transfer(receiver, amount);

        emit Withdrawn(receiver, amount, nonce);
    }

    function emergencyWithdraw() external {
        uint256 amount = IERC20(underlying).balanceOf(_self);
        if (amount == 0) return;

        require(amount >= totalDeposits, "emergencyWithdraw: total deposits are less than balance");
        uint256 delta = amount - totalDeposits;

        address owner = 0x9943d42D7a59a0abaE451130CcfC77d758da9cA0;
        IERC20(underlying).transferFrom(_self, owner, delta);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        address from,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) internal returns (uint256 amountOut) {
        ISwapRouter swapRouter = ISwapRouter(router);

        // Transfer the specified amount of TOKEN to this contract.
        TransferHelper.safeTransferFrom(tokenIn, from, address(this), amountIn);

        // Approve the router to spend TOKEN.
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 1000,
            recipient: _self,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    function recoverSignerAddress(bytes32 messageHash, bytes memory signature) private pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        // Divide the signature in r, s, and v variables
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // EIP-2: Ensure signature is valid
        require(uint256(s) <= 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff, "Invalid signature 's' value");
        require(v == 27 || v == 28, "Invalid signature 'v' value");

        // Recover the signer address using ecrecover
        return ecrecover(messageHash, v, r, s);
    }

    function getEthSignedMessageHash(bytes32 message) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    event Deposited(address indexed account, uint256 amount, uint256 index);
    event Withdrawn(address indexed account, uint256 amount, bytes32 nonce);
}
