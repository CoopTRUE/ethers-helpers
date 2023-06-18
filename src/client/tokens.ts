import ABI from '$lib/ABI'
import { Network, Networks } from '$lib/network'
import {
  Token,
  getBalance as _getBalance,
  transfer as _transfer,
  type Address,
  getPriceViaOracle,
} from '$lib/tokens'
import { ethers } from 'ethers'

/**
 * Used to create a `ClientToken`. However, it is recommended to use `getClientTokens` instead.
 *
 * @example
 * ```ts
 * // Recommended way to create a ClientToken
 * const clientTokens = await getClientTokens(
 *  signer,
 *  networks,
 *  async ({ chainId, token }) => {
 *   const price = customPriceCalculation({ chainId, token })
 *   return price
 *  }
 * )
 * // In the case you want to create a ClientToken manually
 * const clientToken = await ClientTokenFactory.create(
 *  token,
 *  signer,
 *  chainId,
 *  address,
 *  async ({ chainId, token }) => {
 *   const price = customPriceCalculation({ chainId, token })
 *   return price
 *  }
 * )
 * ```
 * @throws Error if `customPriceCalculation` is not defined when `oracleAddress` is undefined
 * @see getClientTokens
 */
class ClientTokenFactory {
  static async create<const T extends Token>(
    ...args: ConstructorParameters<typeof ClientToken>
  ): Promise<ClientToken<T>> {
    const clientToken = new ClientToken(...args)
    await clientToken.initialize()
    // @ts-expect-error clientToken is of type ClientToken<T>
    return clientToken
  }
}

/**
 * ClientToken is a class that is used to interact with a token.
 * Do not create this class manually, instead use `getClientTokens` or `ClientTokenFactory.create`.
 * @internal
 */
class ClientToken<const T extends Token> {
  private readonly contract: ethers.Contract
  private readonly oracleContract?: ethers.Contract
  private decimals: number
  balance: number
  price: number
  constructor(
    readonly token: T,
    private readonly signer: ethers.Signer,
    private readonly chainId: number,
    private readonly signerAddress: Address,
    private readonly customPriceCalculation?: (args: {
      chainId: number
      token: T
    }) => Promise<number> | number
  ) {
    const { address, oracleAddress } = token
    this.contract = new ethers.Contract(address, ABI, signer)
    if (oracleAddress) {
      this.oracleContract = new ethers.Contract(oracleAddress, ABI, signer)
    } else if (!customPriceCalculation) {
      throw new Error(
        'customPriceCalculation must be defined when oracleAddress is undefined'
      )
    }
  }
  /**
   * Returns the balance of the token in the wallet of the signer.
   */
  async getBalance(): Promise<number> {
    return await _getBalance(this.contract, this.signerAddress, this.decimals)
  }
  /**
   * Returns the price of the token in USD.
   */
  async getPrice(): Promise<number> {
    const { oracleContract } = this
    if (oracleContract) {
      return await getPriceViaOracle(oracleContract)
    } else {
      // @ts-expect-error customPriceCalculation is defined when oracleContract is undefined
      return await this.customPriceCalculation({
        chainId: this.chainId,
        token: this.token,
      })
    }
  }
  /**
   * Transfers the token to the specified address.
   */
  async transfer(
    to: Address,
    amount: number
  ): Promise<ethers.ContractTransactionResponse> {
    return await _transfer(this.contract, this.decimals, to, amount)
  }
  /**
   * Updates the balance and price of the token.
   * @example
   * ```ts
   * const const clientTokens = await getClientTokens(...)
   * async function updateTokens() {
   *  await Promise.all(clientTokens.map((clientToken) => clientToken.update()))
   * }
   * setInterval(updateTokens, 1000 * 60 * 5) // Update every 5 minutes
   * ```
   */
  async update(): Promise<void> {
    const newBalance = this.getBalance()
    const newPrice = this.getPrice()
    await Promise.all([
      newBalance.then((balance) => (this.balance = balance)),
      newPrice.then((price) => (this.price = price)),
    ])
  }
  /**
   * This method is called automatically when the ClientToken is created. It should not be called manually.
   * @internal
   */
  async initialize(): Promise<void> {
    this.decimals = Number(await this.contract.decimals())
    await this.update()
  }
}

type TokenWithoutOracleAddress<T extends readonly Token[]> = {
  [K in keyof T]: T[K] extends { oracleAddress: Address } ? never : T[K]
}[number]

/**
 * Returns an array of ClientTokens for the specified signer.
 * @example
 * ```ts
 * const clientTokens = await getClientTokens(
 *  signer,
 *  networks,
 *  async ({ chainId, token }) => {
 *   const price = customPriceCalculation({ chainId, token })
 *   return price
 *  }
 * )
 * ```
 * @throws Error if `customPriceCalculation` is not defined when `oracleAddress` is undefined for a token
 */
export async function getClientTokens<const Ns extends Networks>(
  signer: ethers.Signer,
  networks: Ns,
  customPriceCalculation: (
    args: {
      [C in keyof Ns]: {
        chainId: C
        token: TokenWithoutOracleAddress<Ns[C & number]['tokens']>
      }
    }[keyof Ns]
  ) => Promise<number> | number
): Promise<
  {
    [C in keyof Ns]: ClientToken<Ns[C & number]['tokens'][number]>[]
  }[keyof Ns]
> {
  //Promise<ClientToken<Ns[keyof Ns & number]['tokens'][number]>> {
  const { provider } = signer
  if (!provider) throw new Error('Signer must have a provider')
  const chainId = await provider
    .getNetwork()
    .then(({ chainId }) => Number(chainId))
  const currentNetwork = networks[chainId]
  if (!currentNetwork) throw new Error('Network not supported')
  const address = (await signer.getAddress()) as Address
  const { tokens } = currentNetwork
  const clientTokens = tokens.map((token) =>
    ClientTokenFactory.create(
      token,
      signer,
      chainId,
      address,
      // @ts-expect-error Token is automatically assumed to be a Token without an oracleAddress
      customPriceCalculation
    )
  )
  // console.log(clientTokens[0])
  return await Promise.all(clientTokens)
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
      {
        name: 'Wrapped BNB',
        symbol: 'WBNB',
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        oracleAddress: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
        image: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.svg',
      },
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
      {
        name: 'Wrapped AVAX',
        symbol: 'WAVAX',
        address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
        oracleAddress: '0x0A77230d17318075983913bC2145DB16C7366156',
        image: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
      },
      {
        name: 'Magic Internet Money',
        symbol: 'MIM',
        address: '0x130966628846BFd36ff31a822705796e8cb8C18D',
        image: 'https://s2.coinmarketcap.com/static/img/coins/200x200/162.png',
      },
    ],
  },
} as const satisfies Networks

const wallet = ethers.Wallet.createRandom(
  new ethers.JsonRpcProvider('https://bsc.blockpi.network/v1/rpc/public')
)

getClientTokens(wallet, NETWORKS, ({ chainId, token }) => {
  return void console.log(token) || 100
})
  .then((tokens) => {
    for (const { balance, price } of tokens) {
      console.log(price)
    }
    // a.
    //    ^?
  })
  .catch(console.error)
