pragma solidity 0.4.25;

import '../MonthLib.sol';

contract MonthLibMock {
    using MonthLib for uint256;

    function getHoursInMonth(uint256 a) public pure returns (uint256) {
        return a.getHoursInMonth();
    }
    function getDaysInMonth(uint8 _month, uint16 _year) public pure returns (uint256) {
        return MonthLib.getDaysInMonth(_month, _year);
    }
}
