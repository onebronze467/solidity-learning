//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract MultiManagedAccess {
    
    uint constant MANAGER_NUMBER = 5;
    uint immutable BACKUP_MANAGER_NUMBERS = 3;

    address public owner;
    address[MANAGER_NUMBER] public managers;
    bool[MANAGER_NUMBER] public confirmed;
    mapping(uint256 => bool[MANAGER_NUMBER]) public confirmedRq;



    constructor(address _owner, address[] memory _managers, uint _manager_numbers) {
        require(_managers.length == _manager_numbers, "size unmatched");

        owner = _owner;

        for(uint i = 0; i < MANAGER_NUMBER; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    function allConfirmed() internal view returns (bool) {
        for(uint i = 0; i < MANAGER_NUMBER; i++) {
            if (!confirmed[i]) {
                return false;
            }
        }
        return true;

    }

    function reset() internal {
        for (uint i = 0; i < MANAGER_NUMBER; i++) {
            confirmed[i] = false;
        }
    }

    modifier onlyAllConfirmed () {
        require(allConfirmed(), "Not all managers confirmed yet");
        reset();
        _;
    }

    function confirm() external {
        bool found = false;

        for(uint i = 0; i < MANAGER_NUMBER; i++) {
            if (managers[i] == msg.sender) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        require(found, "You are not one of managers");
        
    }



}