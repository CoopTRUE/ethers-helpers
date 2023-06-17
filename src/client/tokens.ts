import { Token, BasicActivatedToken } from '$lib/tokens'
import { ethers } from 'ethers'
import ABI from '$lib/ABI'
import Network from '$lib/network'

export interface ClientActivatedToken extends BasicActivatedToken {
  balance: number
  serverBalance: number
  price: number
  readonly update: () => Promise<void>
}

export declare function getActivatedClientTokens<const N extends Network>(
  signer: ethers.Signer,
  network: N
): Promise<ClientActivatedToken[]>
// export async function getActivatedClientTokens<const N extends Network>(
//   signer: ethers.Signer,
//   network: N
// ): Promise<ClientActivatedToken[]> {
//   const { provider } = signer
//   if (!provider) throw new Error('Signer must have a provider')
//   const chainId = await provider
//     .getNetwork()
//     .then(({ chainId }) => Number(chainId))
//   const address = await signer.getAddress()
// }
