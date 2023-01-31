const { ethers } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require('./helpers')

require('dotenv').config()
const INFURA_URL = process.env.INFURA_URL

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)

const poolAddressWbtcEth = '0x4585fe77225b41b697c938b018e2ac67ac5a20c0' // WBTC/ETH pool
const poolAddressUsdcEth = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' // USDC/ETH
const poolAddressWbtcUsdc = '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35' // WBTC/USDC

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"

const initQuoterAndTokenPairs = async(poolAddress) => {

    console.log(`Initializing quoter and token pair for address ${poolAddress}...`)

    const quoterContract = new ethers.Contract(
        quoterAddress,
        QuoterABI,
        provider
    )

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

    const immutables = await getPoolImmutables(poolContract)

    return [quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables]
}

const initQuoterAndTokenPairsUsdcEth = async(poolAddress) => {

    console.log(`Initializing quoter and USDC/ETH token pair...`)

    const quoterContract = new ethers.Contract(
        quoterAddress,
        QuoterABI,
        provider
    )

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

    const tokenSymbol0 = 'USDC'
    const tokenSymbol1 = await tokenContract1.symbol()
    const tokenDecimals0 = 6
    const tokenDecimals1 = await tokenContract1.decimals()

    const immutables = await getPoolImmutables(poolContract)

    return [quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables]
}

const initQuoterAndTokenPairsWbtcUsdc = async(poolAddress) => {

    console.log(`Initializing quoter and WBTC/USDC token pair...`)

    const quoterContract = new ethers.Contract(
        quoterAddress,
        QuoterABI,
        provider
    )

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

    const tokenSymbol1 = 'USDC'
    const tokenSymbol0 = await tokenContract0.symbol()
    const tokenDecimals1 = 6
    const tokenDecimals0 = await tokenContract0.decimals()

    const immutables = await getPoolImmutables(poolContract)

    return [quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables]
}

const getPrice = async(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables) => {
    // How many token1 per token0

    const inputAmount = 1

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

    /*console.log('=====================================================================')
    console.log(`${inputAmount} ${tokenSymbol0} can be swapped for ${amountOut} ${tokenSymbol1}`)
    console.log(new Date().toLocaleString());
    console.log('=====================================================================')*/

    return amountOut

}

const getCandlestick = async(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables) => {
    // How many token1 per token0

    setTimeout(function() {
        let dateTime = new Date()
        let open, close, high, low
    
        console.log(`Getting candlestick for ${dateTime.toLocaleString()}...`)
    
        let loop = setTimeout(function() {
            console.log('Pulling price...')
            const currPrice = getPrice(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables)
            if (new Date() - dateTime >= 60000) {
                // Set close price, clear timeout and return values
                close = currPrice
    
                console.log('=====================================================================')
                console.log(`${token0} PRICE CANDLESTICK`)
                console.log(`DateTime: ${dateTime.toLocaleString}`)
                console.log(`Open: ${open} ${tokenSymbol1}`)
                console.log(`High: ${high} ${tokenSymbol1}`)
                console.log(`Low: ${low} ${tokenSymbol1}`)
                console.log(`Close: ${close} ${tokenSymbol1}`)
                console.log('=====================================================================')
                
                clearTimeout(loop)
                return dateTime, open, close, high, low
            } else {
                if (typeof open === 'undefined' || open === null) {
                    // Set open price
                    open = currPrice
                }
                if (typeof high === 'undefined' || high === null || currPrice > high) {
                    // Set high price
                    high = currPrice
                }
                if (typeof low === 'undefined' || low === null || currPrice < low) {
                    // Set low price
                    low = currPrice
                }
            }
        }, 1000); // Every 1s
    }, 60000) // Every 60s
}

const getPriceUsdcEth = async(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables) => {
    // How many USDC per ETH
    const inputAmount = 1

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

    const outputAmount = inputAmount / amountOut

    console.log('=====================================================================')
    console.log(`${inputAmount} ${tokenSymbol1} can be swapped for ${outputAmount} ${tokenSymbol0}`)
    console.log(new Date().toLocaleString());
    console.log('=====================================================================')

    setTimeout(function() {
        getPriceUsdcEth(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables)
    }, 1000); // Every 1 sec

}

function startDelay() {
    console.log('Starting...')
    while(new Date().getSeconds() != 0) {
        
    }
    console.log(`Time start: ${new Date().toLocaleString()}`)
}

/******************  MAIN ******************/

// Pull prices for WBTC/ETH
// startDelay()

initQuoterAndTokenPairs(poolAddressWbtcEth).then(result => {
    let [quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth] = result
    getCandlestick(quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth)
})
/*
initQuoterAndTokenPairs(poolAddressWbtcEth).then(result => {
    let [quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth] = result
    getPrice(quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth)
})


// Pull prices for USDC/ETH
initQuoterAndTokenPairsUsdcEth(poolAddressUsdcEth).then(result => {
    let [quoterContractUsdcEth, tokenSymbol0UsdcEth, tokenSymbol1UsdcEth, tokenDecimals0UsdcEth, tokenDecimals1UsdcEth, immutablesUsdcEth] = result
    getPriceUsdcEth(quoterContractUsdcEth, tokenSymbol0UsdcEth, tokenSymbol1UsdcEth, tokenDecimals0UsdcEth, tokenDecimals1UsdcEth, immutablesUsdcEth)
})

// Pull prices for WBTC/USDC
initQuoterAndTokenPairsWbtcUsdc(poolAddressWbtcUsdc).then(result => {
    let [quoterContractWbtcUsdc, tokenSymbol0WbtcUsdc, tokenSymbol1WbtcUsdc, tokenDecimals0WbtcUsdc, tokenDecimals1WbtcUsdc, immutablesWbtcUsdc] = result
    getPrice(quoterContractWbtcUsdc, tokenSymbol0WbtcUsdc, tokenSymbol1WbtcUsdc, tokenDecimals0WbtcUsdc, tokenDecimals1WbtcUsdc, immutablesWbtcUsdc)
})*/