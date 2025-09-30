// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1363} from "./ERC1363/IERC1363.sol";
import {IERC1363Receiver} from "./ERC1363/IERC1363Receiver.sol";

contract RIOToken is ERC20, Ownable, IERC1363 {
    address public constant MULTISIG = 0x86aa6Ac064b556c2CF38e5c97986423B2ee4e6Ee;
    uint256 public constant TOTAL_SUPPLY = 52_000_000 * 10 ** 18; // 52 million RIO

    constructor() ERC20("Run it once", "RIO") Ownable(msg.sender) {
        // Mint all tokens to the multisig address
        _mint(MULTISIG, TOTAL_SUPPLY);
        
        // Transfer ownership to multisig
        _transferOwnership(MULTISIG);
    }

    /**
     * @dev Approve spender to spend tokens and call receiveApproval on spender contract
     * @param spender The address which will spend the tokens
     * @param amount The amount of tokens to be spent
     * @param extraData Additional data to pass to the receiving contract
     */
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