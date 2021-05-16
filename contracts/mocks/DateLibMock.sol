//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import '../DateLib.sol';

contract DateLibMock {
    using DateLib for uint256;

    function getHoursInMonth(uint256 a) public pure returns (uint256) {
        return a.getHoursInMonth();
    }
}
