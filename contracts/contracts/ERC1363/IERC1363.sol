// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * An extension interface for ERC-20 tokens that supports executing code on a recipient contract after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 {
    function approveAndCall(address spender, uint256 value, bytes memory data) external returns (bool);
}