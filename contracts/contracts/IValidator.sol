// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IValidator {
    function isValidator(address account) external view returns (bool);
}