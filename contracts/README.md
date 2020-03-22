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

# Set Growth Rates and Price Factors
### Call setPriceFactors on Rise contract
function:
```
function setPriceFactors(uint256 _growthRate, uint256[4] _priceFactors)
```
example: 
```js
riseContract.setPriceFactors(10, [148736, 143607, 138820, 134342]).send();
riseContract.setPriceFactors(11, [163601, 157960, 152694, 147769]).send();
...
riseContract.setPriceFactors(3000, [39049924, 37703121, 36446122, 35270233]).send();
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

# Mint Block
### Call lockPriceFactors to freeze growth rates
function:
```
function lockPriceFactors()
```
example: 
```js
riseContract.lockPriceFactors().send();
```
### Call doCreateBlock on Rise contract
function:
```
function doCreateBlock(uint256 _blockNumber, uint256 _growthRate)
```
example:
```js
riseContract.doCreateBlock(447792, 101).send();
```
supporting JS code:
```js
const blockNumber = Math.floor(Date.parse('2021-01-31') / (60 * 60 * 1000));
```