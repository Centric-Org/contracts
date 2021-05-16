//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import '../Cash.sol';


contract CashBurnFromRiseMock is Cash {
    constructor(address _mintSaver) Cash(_mintSaver) {}

    function burnFromRise(address tokensOwner, uint256 value) external override returns (bool) {
        return false;
    }
}
