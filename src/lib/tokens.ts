import type { ethers } from 'ethers'

export type Address = `0x${string}`
export interface Token {
  readonly name: string
  readonly symbol: string
  readonly address: Address
  readonly oracleAddress?: Address
  readonly image: string
}

export async function getBalance(
  contract: ethers.Contract,
  address: string,
  decimals: number
) {
  const balance = (await contract.balanceOf(address)) as bigint
  return Number(balance) / 10 ** decimals
}

export async function transfer(
  contract: ethers.Contract,
  decimals: number,
  to: Address,
  amount: number
) {
  const formattedAmount = amount * 10 ** decimals
  return (await contract.transfer(
    to,
    formattedAmount
  )) as ethers.ContractTransactionResponse
}

export async function getPriceViaOracle(
  oracleContract: ethers.Contract
): Promise<number> {
  const latestRound = (await oracleContract.latestRoundData()) as {
    answer: bigint
  }
  return Number(latestRound.answer) / 10 ** 8
}
