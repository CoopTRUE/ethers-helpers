import type Network from '$lib/network'
import { ethers } from 'ethers'
import { type ClientActivatedToken, getActivatedClientTokens } from './tokens'
type ClientActivatedNetwork<N extends Network> = Omit<N, 'tokens'> & {
  tokens: readonly ClientActivatedToken[]
}

export async function getClientActivatedNetwork<const N extends Network>(
  signer: ethers.Signer,
  network: N
): Promise<ClientActivatedNetwork<N>> {
  const activatedTokens = await getActivatedClientTokens(signer, network)
  return { ...network, tokens: activatedTokens }
}

const network = {
  name: 'Binance Smart Chain',
  nativeCurrency: 'BNB',
  rpc: 'https://rpc.ankr.com/bsc',
  explorer: 'https://snowtrace.io/',
  tokens: [
    {
      name: 'Binance-Peg BUSD Token',
      symbol: 'BUSD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      oracleAddress: '0xcBb98864Ef56E9042e7d2efef76141f15731B82f',
      image: 'https://cryptologos.cc/logos/binance-usd-busd-logo.svg',
    },
  ],
} as const
getClientActivatedNetwork(ethers.Wallet.createRandom(), network)
  .then((d) => {
    d.tokens
  })
  .catch((e) => {
    console.error(e)
  })
// ^?
