import type { ethers } from 'ethers'

export interface Token {
  readonly name: string
  readonly symbol: string
  readonly address: string
  readonly oracleAddress?: string
  readonly image: string
}

interface ActivatedTokenBase extends Token {
  readonly transfer: (
    to: string,
    amount: number
  ) => Promise<ethers.ContractTransactionResponse>
}
export interface ActivatedClientToken extends ActivatedTokenBase {
  balance: number
  serverBalance: number
  price: number
  readonly update: () => Promise<void>
}
export interface ActivatedServerToken extends ActivatedTokenBase {
  readonly getServerBalance: () => Promise<number>
  readonly getPrice: () => Promise<number>
  readonly getTransferArgs: (
    data: string
  ) => { to: string; amount: number } | null
}
