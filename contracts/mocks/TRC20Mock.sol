//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import '../TRC20.sol';

// mock class using TRC20
contract TRC20Mock is TRC20 {
    constructor (address initialAccount, uint256 initialBalance) {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function burnFrom(address account, uint256 value) public {
        _burnFrom(account, value);
    }
}