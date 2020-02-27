pragma solidity 0.4.25;

import '../RoundMath.sol';

contract RoundMathContract {
    function roundDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return RoundMath.roundDiv(a, b);
    }

    function ceilDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return RoundMath.ceilDiv(a, b);
    }
}
