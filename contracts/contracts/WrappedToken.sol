// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC1363} from "./ERC1363/IERC1363.sol";
import {IERC1363Receiver} from "./ERC1363/IERC1363Receiver.sol";

contract WrappedToken is ERC20, IERC1363 {
    address private immutable _underlying;

    constructor(address underlying) ERC20("Wrapped Token", "WTK") {
        _underlying = underlying;
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
