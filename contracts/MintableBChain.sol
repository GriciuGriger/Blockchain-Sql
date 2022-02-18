//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./BChainSql.sol";


contract MintableBChain is Initializable, BChainSql {

    event MinterStatus(address indexed from, address indexed to, bool minter);
    mapping(address => bool) isMinter;

    function initialize() public initializer {
        isMinter[msg.sender] = true;        
    }

    function expandMinterRole(address account) external {
        require(isMinter[msg.sender] = true, "Error, only an account with minter role can grant a minter role");  
        isMinter[account] = true;

        emit MinterStatus(msg.sender, account, true);
    }

    function depriveMinterRole(address account) external {
        require(isMinter[msg.sender] = true, "Error, only an account with minter role can grant a minter role");  
        isMinter[account] = false;

        emit MinterStatus(msg.sender, account, false);
    }

    function mint(address account, uint256 amount) external {
        require(isMinter[msg.sender] == true, "Error, msg.sender does not have a minter role");
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;

        emit Transfer(address(0), account, amount);
    }

    function burn(address account, uint256 amount) external {
        require(isMinter[msg.sender] == true, "Error, msg.sender does not have a minter role");
        require(account != address(0), "ERC20: burn from the zero address");
        require(_balances[account] >= amount, "ERC20: burn amount exceeds balance");
    
        _balances[account] -= amount;
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);
    }

}