//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";


contract BChainSql is Initializable, IERC20Upgradeable, IERC20MetadataUpgradeable {
    //add contractOwner variable
    address public contractOwner;

    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => uint256) internal _balances;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 internal _totalSupply;

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_
    ) public virtual initializer {
        contractOwner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _totalSupply = totalSupply_;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external virtual override returns (bool){
        require(amount <= _balances[sender], "ERC20: transfer amount exceeds balance");    
        require(amount <= _allowances[sender][msg.sender], "ERC20: transfer amount exceeds allowance");

        _balances[sender] -= amount;
        _allowances[sender][msg.sender] -= amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool){
        require(msg.sender != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[msg.sender][spender] = 0;
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount)
        external
        virtual
        override
        returns (bool)
    {
        require(msg.sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");

        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

   // function balances() public view returns (mapping(address => uint)){}

    function balanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _balances[account];
    }
}
