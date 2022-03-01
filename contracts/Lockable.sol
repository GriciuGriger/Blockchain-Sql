//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Mintable.sol";

contract Lockable is Mintable {

    event FundsLockedStatus(address locker, address locked, uint256 time, bool status);
    event LockTimeExpiry(address unlocked);

    event LockingPrivilegeStatus(address granter, address granted, bool status);
    event GlobalLockChanged(address locker, bool lock);

    bool private _globalLock;

    mapping(address => uint256) _deadline;
    mapping(address => bool) _hasLockingPrivilege; 
    mapping(address => bool) _isLocked;

    function initialize() public virtual override {
        _hasLockingPrivilege[msg.sender] = true;        
    }

    modifier NonLockedOnly() {
        require(!_globalLock, "All funds are globally locked.");
        require(!_isLocked[msg.sender], "Sender account's transfer capabilities are locked.");
        _;
    }

    modifier lockPrivilegeOnly() {
        require(_hasLockingPrivilege[msg.sender], "This account has no locking privilege.");
        _;
    }

    modifier noDeadline(address account){

         if(_deadline[account] != 0){
            string memory errorMessage = timeLeft("Deadline: Funds of address ", account, " are locked for ", 
            ((_deadline[account] - block.timestamp)/1 days), " days.");

            require(block.timestamp >= _deadline[account], errorMessage);
            _deadline[account] = 0;
            emit LockTimeExpiry(account);
        }
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

    function lockFunds(address account, uint256 numberOfDays) external lockPrivilegeOnly {
      _isLocked[account] = true;
      _deadline[account] = block.timestamp + (numberOfDays * 1 days);
      emit FundsLockedStatus(msg.sender, account, numberOfDays * 1 days, true);
    }

    function unlockFunds(address account) external lockPrivilegeOnly {
        _isLocked[account] = false;
        _deadline[account] = 0;
        emit FundsLockedStatus(msg.sender, account, block.timestamp, false);
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
        NonLockedOnly
        noDeadline(recipient)
        returns (bool)
    {

      return transfer(recipient, amount);
    }

     function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public 
      virtual 
      override 
      NonLockedOnly 
      noDeadline(sender)
      noDeadline(recipient)
      returns (bool) {

       return transferFrom(sender, recipient, amount);
    }

    function timeLeft(string memory a, address b, string memory c, uint256 d, string memory e) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c, d, e));
    }


}