// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IValidator {
    function isValidator(address account) external view returns (bool);
    function validatorCount() external view returns (uint256);
    function getValidatorAddress(uint256 index) external view returns (address);
}