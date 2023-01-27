const { ethers } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require('./helpers')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)

const poolAddress = '0x4585fe77225b41b697c938b018e2ac67ac5a20c0' // WBTC/ETH pool

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"

const getPrice = async(inputAmount) => {
    // How many ETH per 1 unit token
    const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        provider
    )

    const tokenAddress0 = await poolContract.token0(); // WBTC
    const tokenAddress1 = await poolContract.token1(); // ETH

    const tokenAbi0 = await getAbi(tokenAddress0) // WBTC
    const tokenAbi1 = await getAbi(tokenAddress1) // ETH

    const tokenContract0 = new ethers.Contract(
        tokenAddress0,
        tokenAbi0,
        provider
    )

    const tokenContract1 = new ethers.Contract(
        tokenAddress1,
        tokenAbi1,
        provider
    )

    const tokenSymbol0 = await tokenContract0.symbol()
    const tokenSymbol1 = await tokenContract1.symbol()
    const tokenDecimals0 = await tokenContract0.decimals()
    const tokenDecimals1 = await tokenContract1.decimals()

    const quoterContract = new ethers.Contract(
        quoterAddress,
        QuoterABI,
        provider
    )

    const immutables = await getPoolImmutables(poolContract)

    const amountIn = ethers.utils.parseUnits(
        inputAmount.toString(),
        tokenDecimals0
    )

    const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        immutables.token0,
        immutables.token1,
        immutables.fee,
        amountIn,
        0
    )

    const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1)

    console.log('=========')
    console.log(`${inputAmount} ${tokenSymbol0} can be swapped for ${amountOut} ${tokenSymbol1}`)
    console.log('=========')
}

getPrice(1)