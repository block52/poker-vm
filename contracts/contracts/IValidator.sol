// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

interface IValidator {
    function isValidator(address account) external view returns (bool);
    function validatorCount() external view returns (uint8);
    function getValidatorAddress(uint256 index) external view returns (address);
}