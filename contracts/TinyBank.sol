// staking
// deposit(MyTokne) / withdraw(MyToken)

// MyToken : token balance management
//  - the balance of TinyBank address
// TinyBank : deposit / withdraw value
//  - users token management
//  - user --> deposit --> TinyBank --> transfer(TinyBank --> user)

// Reward
// - reward token : MyToken
// - reward resource : 1 MY/block minting
// - reward strategy : staked[user]/totalStaked distribution

//  - signer0 block 0 staking
//  - signer1 block 5 staking
//  - 0-- 1-- 2-- 3-- 4-- 5--
//    |                   |
//  - signer0 10MT        signer1 10MT

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    
    function transferFrom(address from, address to, uint256 amount) external;
    
    function mint(uint256 amount, address owner) external;
}

contract TinyBank {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClamimBlock;
    address[] public stakedUsers;
    uint256 rewardPerBlock = 1 * 10 ** 18;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    constructor(IMyToken _stakingToken) {
        stakingToken = _stakingToken;
    }

    // who, when?
    function distrbuteReward() internal {
        for(uint i = 0; i < stakedUsers.length; i++) {
            uint256 blocks = block.number - lastClamimBlock[stakedUsers[i]];
            uint256 reward = (blocks * rewardPerBlock * staked[stakedUsers[i]]) / totalStaked;
            stakingToken.mint(reward, stakedUsers[i]);
            lastClamimBlock[stakedUsers[i]] = block.number;
        }
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        stakedUsers.push(msg.sender);
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        if(staked[msg.sender] == 0) {
            uint256 index;
            for(uint i = 0; i < stakedUsers.length; i++) {
                if(stakedUsers[i] == msg.sender) {
                    index = i;
                    break;
                }
            }
            stakedUsers[index] = stakedUsers[stakedUsers.length - 1];
            stakedUsers.pop();
        }
        emit Withdraw(_amount, msg.sender);
    }
}