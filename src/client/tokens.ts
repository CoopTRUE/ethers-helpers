import ABI from '$lib/ABI'
import { Network, Networks } from '$lib/network'
import { Token, BasicActivatedToken } from '$lib/tokens'
import { ethers } from 'ethers'

class ClientToken implements BasicActivatedToken {
  private readonly contract: ethers.Contract
  constructor(
    private readonly signer: ethers.Signer,
    private readonly signerAddress: string,
    private readonly token: Token,
    public balance: number,
    public serverBalance: number,
    public price: number
  ) {
    this.contract = new ethers.Contract(token.address, ABI, signer)
  }
  async transfer(to: string, amount: number) {
    return (await this.contract.transfer(
      to,
      amount
    )) as ethers.ContractTransactionReceipt
  }
  async update(): Promise<void> {
    const getBalance = async (address: string, decimals: number) => {
      const balance = await this.contract
        .balanceOf(address)
        .then((balance) => Number(balance))
      return Number(balance) / 10 ** decimals
    }
    await Promise.all([
      getBalance(this.signerAddress, this.token.decimals).then(
        (balance) => (this.balance = balance)
      ),
    ])
  }
}

/**
 * customPriceCalculation gets invoked if a token doesn't have an oracleAddress. It is passed the chainId and the token and should return the price of the token.
 */
export async function getClientTokens<const Ns extends Networks>(
  signer: ethers.Signer,
  networks: Ns,
  customPriceCalculation: (
    chainId: keyof Ns,
    token: Token
  ) => Promise<number> | number
): Promise<ClientToken[]> {
  const { provider } = signer
  if (!provider) throw new Error('Signer must have a provider')
  const chainId = await provider
    .getNetwork()
    .then(({ chainId }) => Number(chainId) as keyof Ns)
  const currentNetwork = networks[chainId] as Network
  if (!currentNetwork) throw new Error('Network not supported')
  const { tokens } = currentNetwork
  const activatedTokens = tokens.map((token) =>
    buildClientTokens(signer, token)
  )
  return await Promise.all(activatedTokens)
}

const NETWORKS = {
  56: {
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
      // {
      //   name: 'Wrapped BNB',
      //   symbol: 'WBNB',
      //   decimals: 18,
      //   roundPrecision: 5,
      //   address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      //   oracleAddress: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
      //   image: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.svg'
      // },
      {
        name: 'Binance-Peg Ethereum Token',
        symbol: 'ETH',
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        oracleAddress: '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',
        image: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
      },
      {
        name: 'Binance-Peg USD COIN',
        symbol: 'USDC',
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        oracleAddress: '0x51597f405303C4377E36123cBc172b13269EA163',
        image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
      },
    ],
  },
  43114: {
    name: 'Avalanche C-Chain',
    nativeCurrency: 'AVAX',
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io/',
    tokens: [
      {
        name: 'USD Coin',
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        oracleAddress: '0xF096872672F44d6EBA71458D74fe67F9a77a23B9',
        image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
      },
      // {
      //   name: 'Wrapped AVAX',
      //   symbol: 'WAVAX',
      //   decimals: 18,
      //   roundPrecision: 5,
      //   address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      //   oracleAddress: '0x0A77230d17318075983913bC2145DB16C7366156',
      //   image: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg'
      // },
      {
        name: 'Magic Internet Money',
        symbol: 'MIM',
        address: '0x130966628846BFd36ff31a822705796e8cb8C18D',
        image: 'https://s2.coinmarketcap.com/static/img/coins/200x200/162.png',
      },
    ],
  },
} as const satisfies Networks
