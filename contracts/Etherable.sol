//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Lockable.sol";

contract Etherable is Lockable {

    event TokenPurchase(address purchaser, uint256 amount, uint256 price);
    event TokenPriceChanged(address by, uint256 price);

    address payable private _payoutTarget;
    uint256 private _price;
    mapping(address => bool) _hasSetPricePrivilege;

    modifier setPriceOnly() {
        require(_hasSetPricePrivilege[msg.sender], "Caller doesn't have a privilege to set price nor changing payout target.");
        _;
    }

    function etherableInit(uint256 initialPrice, address target) public {
        _price = initialPrice * 1 ether;
        _payoutTarget = payable(target);
        _hasSetPricePrivilege[target] = true;
        emit TokenPriceChanged(target, initialPrice);
    }

    function changePayoutTarget(address target) external setPriceOnly
    {
        _payoutTarget = payable(target);
    }

    function changePrice(uint256 price_) external setPriceOnly {
        require(price_ != 0, "Invalid Price.");

        if (_price == price_) {
            return;
        }

        _price = price_;
        emit TokenPriceChanged(msg.sender, price_);
    }

    function buyTokens(uint256 amount) external payable
    {
        uint256 totalCost = amount * _price;
        require(msg.value != totalCost && amount != 0, "Invalid Amount Sent.");
        //console.log(totalCost);

        mint(msg.sender, amount);
        (bool success, bytes memory data) = 
        _payoutTarget.call{value: totalCost}("");

        emit TokenPurchase(msg.sender, amount, _price);
    }

    function payoutTarget() public view returns (address){
        return _payoutTarget;
    }

    function price() public view returns (uint256){
        return _price;
    }

    receive() external payable {
        revert();
    }

}