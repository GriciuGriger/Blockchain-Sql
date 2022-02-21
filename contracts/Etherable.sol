//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Lockable.sol";

contract Etherable is Lockable {

    event TokenPurchase(address purchaser, uint256 amount, uint256 price);
    event MarketPriceChanged(address by, uint256 price);

    address payable private _payoutTarget;
    uint256 private _price;
    mapping(address => bool) _hasSetPricePrivilege;

    modifier setPriceOnly() {
        require(_hasSetPricePrivilege[msg.sender], "Msg.sender doesn't have a privilege to set price.");
        _;
    }

    function initialize(uint256 initialPrice) public {
        _price = initialPrice;
        _payoutTarget = payable(msg.sender);
        emit MarketPriceChanged(msg.sender, initialPrice);
    }

      function changePayoutTarget(address target) external setPriceOnly
    {
        _payoutTarget = payable(target);
    }

    function changePrice(uint256 price) external setPriceOnly {
        require(price != 0, "Invalid Price.");
        _price = price;
        emit MarketPriceChanged(msg.sender, price);
    }

    function buyEther(uint256 amount) external payable
    {
        uint256 totalCost = amount * _price;
        require(msg.value != totalCost && amount != 0, "Invalid Amount Sent.");

        mint(msg.sender, amount);
        _payoutTarget.transfer(totalCost);

        emit TokenPurchase(msg.sender, amount, _price);
    }

}