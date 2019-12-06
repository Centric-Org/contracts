pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TRC20.sol';

contract UriseToken is TRC20Burnable, TRC20Detailed, TRC20Mintable {

    function transferForOwner(address from, address to, uint256 value) public onlyContractOwner returns (bool) {
        require(from != address(0), 'EMPTY_FROM');
        require(to != address(0), 'EMPTY_TO');
        _transfer(from, to, value);
        return true;
    }
}
