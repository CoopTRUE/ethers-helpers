import type { ethers } from 'ethers'

export interface Token {
  readonly name: string
  readonly symbol: string
  readonly address: string
  readonly oracleAddress?: string
  readonly image: string
}
