// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC1363} from "./ERC1363/IERC1363.sol";
import {IERC1363Receiver} from "./ERC1363/IERC1363Receiver.sol";

contract WrappedToken is ERC20, IERC1363 {
    address private immutable _underlying;

    constructor(address underlying) ERC20("Wrapped Token", "WTK") {
        _underlying = underlying;
    }

    function wrap(uint256 amount) external {
        // Transfer the tokens from the sender to this contract
        IERC20(_underlying).transferFrom(msg.sender, address(this), amount);

        // Mint the wrapped tokens to the sender
        _mint(msg.sender, amount);
    }

    function unwrap(uint256 amount) external {
        // Burn the wrapped tokens from the sender
        _burn(msg.sender, amount);

        // Transfer the tokens from this contract to the sender
        IERC20(_underlying).transfer(msg.sender, amount);
    }

    function approveAndCall(
        address spender,
        uint256 amount,
        bytes calldata extraData
    ) external returns (bool) {
        // Approve the spender to spend the tokens
        _approve(msg.sender, spender, amount);

        // Call the receiveApproval function on the spender contract
        IERC1363Receiver(spender).receiveApproval(
            msg.sender,
            amount,
            address(this),
            extraData
        );

        return true;
    }
}
