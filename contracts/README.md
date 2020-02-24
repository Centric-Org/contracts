# Deploy
### Deploy Cash.sol
function:
```
constructor(address _mintSaver)
```

### Deploy Rise.sol
function:
```
constructor(address _mintSaver, address _cashContract)
```

# Init
### Call setRiseContract on Cash contract 
function:
```
setRiseContract(address _riseContractAddress)
```
example: 
```js
cashContract.setRiseContract(RISE_CONTRACT_ADDRESS).send();
```

# Mint Block
### Call updateFutureGrowthRate on Rise contract
function:
```
updateFutureGrowthRate(uint256 _growthRate, uint256[4] _priceFactors)
```
example: 
```js
riseContract.updateFutureGrowthRate(1000, [14184069, 13694930, 13238402, 12811329]).send();
```
supporting JS code:
```js
const monthlyGrowth = 0.1 // 10%
const growthRate = Math.round(monthlyGrowth * 10000);
const priceFactors = [
  getNthRootPowered(growthRate, 28 * 24),
  getNthRootPowered(growthRate, 29 * 24),
  getNthRootPowered(growthRate, 30 * 24),
  getNthRootPowered(growthRate, 31 * 24),
];

function getNthRootPowered(growthRate, n) {
  const a = 1 + (growthRate / 10000);

  const powered = (a ** (1 / n)) * 10 ** 11;
  return Math.ceil(powered - 1 * 10 ** 11);
}
```

### Call doCreateBlock on Rise contract
function:
```
doCreateBlock(uint256 _monthBlocks, uint256 _blockNumber)
```
example:
```js
riseContract.doCreateBlock(30 * 24, 447792).send();
```
supporting JS code:
```js
const blockNumber = Math.floor(Date.parse('2021-01-31') / (60 * 60 * 1000));
```