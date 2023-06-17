import { ethers } from 'ethers'
import { Token } from './tokens'

export interface Network {
  readonly name: string
  readonly nativeCurrency: string
  readonly rpc: string
  readonly explorer: string
  readonly tokens: readonly Token[]
}

export interface Networks {
  [chainId: number]: Network
}
