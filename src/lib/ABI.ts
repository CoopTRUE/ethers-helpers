export default [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address addr) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  // latestRoundData is for checking price via Chainlink oracle
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]
