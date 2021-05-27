//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import '../CentricSwap.sol';


contract SwapBurnFromRiseMock is CentricSwap {
    constructor(address _mintSaver) CentricSwap(_mintSaver) {}

    function burnFromRise(address tokensOwner, uint256 value) external override returns (bool) {
        return false;
    }
}
