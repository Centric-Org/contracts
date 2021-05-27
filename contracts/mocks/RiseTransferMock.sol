//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import './RiseMock.sol';

contract RiseTransferMock is RiseMock {
    constructor(address _mintSaver, address _swapContract) RiseMock(_mintSaver, _swapContract) {}

    function transfer(address to, uint256 value) public override returns (bool) {
        return false;
    }
}
