//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract A {

    function mint() public returns (string memory){
        return "minted!";
    }

}

contract B is A {

    function meow() external{
        mint();
    }

}