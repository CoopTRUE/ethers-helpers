import type { ethers } from 'ethers'

export interface Token {
  readonly name: string
  readonly symbol: string
  readonly address: string
  readonly OracleAddress?: string
  readonly image: string
}

export interface BasicActivatedToken extends Token {
  readonly transfer: (
    to: string,
    amount: number
  ) => Promise<ethers.ContractTransactionReceipt>
}
