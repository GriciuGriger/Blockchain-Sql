//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./MyBaseContract.sol";

contract Mintable is MyBaseContract {

    event MinterStatus(address from, address to, bool minter);
    event SupplyChanged(uint256 oldSupply, uint256 newSupply);

    mapping(address => bool) isMinter;

    modifier mintAccess(address account, uint256 amount) {
        require(isMinter[msg.sender], "Error, msg.sender does not have a minter role");
        require(account != address(0), "Mint to the zero address");
        require(amount != 0, "Cannot mint 0 tokens");
        _;
    }

    modifier burnAccess(address account, uint256 amount) {
        require(isMinter[msg.sender], "Error, msg.sender does not have a minter role");
        require(account != address(0), "ERC20: burn from the zero address");
        require(_balances[account] >= amount, "ERC20: burn amount exceeds balance");
        _;
    }

    function mintableInit(address admin) public {
        isMinter[admin] = true;  
    }

    function grantMinterRole(address account) external {
        require(isMinter[msg.sender], "Error, only an account with minter role can grant a minter role");  
        isMinter[account] = true;

        emit MinterStatus(msg.sender, account, true);
    }

    function depriveMinterRole(address account) external {
        require(isMinter[msg.sender], "Error, only an account with minter role can deprive a minter role");  
        isMinter[account] = false;

        emit MinterStatus(msg.sender, account, false);
    }

    function mint(address account, uint256 amount) public mintAccess(account, amount) {

        _totalSupply += amount;
        _balances[account] += amount;

        emit SupplyChanged(_totalSupply-amount, _totalSupply);
        emit Transfer(address(0), account, amount);
    }

    function burn(address account, uint256 amount) public burnAccess(account, amount){
    
        _balances[account] -= amount;
        _totalSupply -= amount;

        emit SupplyChanged(_totalSupply+amount, _totalSupply);
        emit Transfer(account, address(0), amount);
    }


}