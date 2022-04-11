//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {MyBaseContract} from "./MyBaseContract.sol";
import "./Mintable.sol";

contract Lockable is Mintable {

    event FundsLockedStatus(address locker, address locked, bool status);
    event LockingPrivilegeStatus(address granter, address granted, bool status);
    event GlobalLockChanged(address locker, bool lock);

    bool private _globalLock;

    mapping(address => bool) _hasLockingPrivilege; 
    mapping(address => bool) _isLocked;

    function lockableInit(address admin) public {
        _hasLockingPrivilege[admin] = true;        
    }

    modifier lockPrivilegeOnly() {
        require(_hasLockingPrivilege[msg.sender], "This account has no locking privilege.");
        _;
    }

    modifier NonLockedOnlyTransfer(address account) {
     
        require(!_globalLock, "All funds are globally locked.");
        require(!_isLocked[msg.sender], "Sender's account is locked.");
        require(!_isLocked[account], "Recipient's account is locked."); 
        _;
    }

    modifier NonLockedOnlyTransferFrom(address sender, address recipient) {

        require(!_globalLock, "All funds are globally locked.");
        require(!_isLocked[msg.sender], "Allowance caller's account is locked.");
        require(!_isLocked[sender], "Sender's account is locked."); 
        require(!_isLocked[recipient], "Recipient's account is locked."); 
        _;

    }

    function grantLockingPrivilege(address account) external lockPrivilegeOnly {
        _hasLockingPrivilege[account] = true;
        emit LockingPrivilegeStatus(msg.sender, account, true);
    }

    function depriveLockingPrivilege(address account) external lockPrivilegeOnly {
        _hasLockingPrivilege[account] = false;
        emit LockingPrivilegeStatus(msg.sender, account, false);
    }

    function lockFunds(address account) external lockPrivilegeOnly {
        if(_isLocked[account] == true) {
            return;
        }

        _isLocked[account] = true;     
        emit FundsLockedStatus(msg.sender, account, true);
    }

    function unlockFunds(address account) external lockPrivilegeOnly {
        if(_isLocked[account] == false){
            return;
        }

        _isLocked[account] = false;
        emit FundsLockedStatus(msg.sender, account, false);
    }

    function setGlobalLock(bool lock) external lockPrivilegeOnly {
         if (_globalLock == lock) {
            return;
        }
        _globalLock = lock;
        emit GlobalLockChanged(msg.sender, lock);
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        NonLockedOnlyTransfer(recipient)
        returns (bool)
    {
       return MyBaseContract.transfer(recipient, amount);
    }

     function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public 
      virtual 
      override  
      NonLockedOnlyTransferFrom(sender, recipient)
      returns (bool) {

       return MyBaseContract.transferFrom(sender, recipient, amount);
    }

    // function timeLeft(string memory a, address b, string memory c, uint256 d, string memory e) internal pure returns (string memory) {
    //     return string(abi.encodePacked(a, b, c, d, e));
    // }

}