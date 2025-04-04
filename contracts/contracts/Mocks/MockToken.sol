// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC1363} from "./ERC1363/IERC1363.sol";
import {IERC1363Receiver} from "./ERC1363/IERC1363Receiver.sol";

contract MockToken is ERC20, IERC1363 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
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
