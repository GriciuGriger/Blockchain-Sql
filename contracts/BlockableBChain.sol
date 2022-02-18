//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./MintableBChain.sol";

contract BlockableBChain is MintableBChain {

    event FundsLocked(address locker, address locked, uint256 time);
    bool private _globalLock = false;

    mapping(address => uint256) _deadline;
    mapping(address => bool) _hasLockingPrivilege; 
    mapping(address => bool) _isLocked;

    modifier NonLockedOnly() {
        require(_isLocked[msg.sender] == false, "Sender account's transfer capabilities are locked.");
        _;
    }

    modifier lockPrivilegeOnly() {
        require(_hasLockingPrivilege[msg.sender] == true, "This account has no locking privilege and cannot lock funds for target address.");
        _;
    }

    function lockFunds(address account, uint256 numberOfDays) external lockPrivilegeOnly {
      
      _isLocked[account] = true;
      _deadline[account] = block.timestamp + (numberOfDays * 1 days);
      
    }

   function transfer(address recipient, uint256 amount)
        external
        virtual
        override
        NonLockedOnly
        returns (bool)
    {
        string memory errorMessage = timeLeft("transfer: Funds of address ", toString(recipient), " are locked for ", 
        toString((_deadline[recipient] - block.timestamp)/1 days), " days.");

        require(block.timestamp >= _deadline[recipient], errorMessage);
        
        BChainSql.transfer(recipient, amount);
    }

     function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external virtual override NonLockedOnly {
        require(block.timestamp >= _deadline[sender], "transferFrom: ");
    
        BChainSql.transferFrom(sender, recipient, amount);
    }

    function timeLeft(string memory a, string memory b, string memory c, string memory d, string memory e) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c, d, e));
    }

    function toString(address account) public pure returns(string memory) {
    return toString(abi.encodePacked(account));
    }   

    function toString(uint256 value) public pure returns(string memory) {
    return toString(abi.encodePacked(value));
    }

}