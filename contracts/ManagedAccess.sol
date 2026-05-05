// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address[] public managers;

    mapping (address => bool) public isManager;
    mapping (bytes32 => mapping(address => bool)) public isConfirmed;
    mapping (bytes32 => uint256) public confirmationCount;

    constructor(address[] memory _managers) {
        require(_managers.length >= 3, "Managers must be at least 3");
        
        for (uint256 i = 0; i < _managers.length; i++) {
            address manager = _managers[i];
            
            require(manager != address(0), "Invalid manager address");
            require(!isManager[manager], "Duplicate manager address");

            isManager[manager] = true;
            managers.push(manager);
        }
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    modifier onlyAllConfirmed() {
        bytes32 actionId = bytes32(msg.sig);
        require(confirmationCount[actionId] == managers.length, "Not all confirmed yet");
        _;
    }

    function confirmAction(bytes32 actionId) external onlyManager {
        require(!isConfirmed[actionId][msg.sender], "Already confirmed");
        
        isConfirmed[actionId][msg.sender] = true;
        confirmationCount[actionId] += 1;
    }
}
