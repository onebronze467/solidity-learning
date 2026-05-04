// staking
// deposit(MyTokne) / withdraw(MyToken)

// MyToken : token balance management
//  - the balance of TinyBank address
// TinyBank : deposit / withdraw value
//  - users token management
//  - user --> deposit --> TinyBank --> transfer(TinyBank --> user)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    
    function transferFrom(address from, address to, uint256 amount) external;
    
}

contract TinyBank {
    IMyToken public stakingToken;
    constructor(IMyToken _stakingToken) {
        stakingToken = _stakingToken;
        
    }
}