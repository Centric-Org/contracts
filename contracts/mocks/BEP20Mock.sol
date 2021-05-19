//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import '../BEP20.sol';

// mock class using TRC20
contract BEP20Mock is BEP20 {
    constructor (address initialAccount, uint256 initialBalance) BEP20('BEP20Mock', 'BEPM', 8) {
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