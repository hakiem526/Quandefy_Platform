/******************  INIT WEB3 VARIABLES ******************/
const { ethers, Contract } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require('./helpers');

require('dotenv').config();
const INFURA_URL = process.env.INFURA_URL;

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

const poolAddressWbtcEth = '0x4585fe77225b41b697c938b018e2ac67ac5a20c0'; // WBTC/ETH pool
const poolAddressUsdcEth = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // USDC/ETH
const poolAddressWbtcUsdc = '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35'; // WBTC/USDC

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

/******************  INIT SQL VARIABLES ******************/
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_NAME,
    port: process.env.PORT
});

/**
 * Initializes Quoter instance and Contract instances of tokens.
 * 
 * @param {String} poolAddress Pool address of token pair on Uniswap
 * @return {Contract} Contract instance of Quoter
 * @return {String} Token symbol for token0
 * @return {String} Token symbol for token1
 * @return {Number} Token decimals for token0
 * @return {Number} Token decimals for token1
 * @return {var} Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
*/
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

/**
 * Initializes Quoter instance and Contract instances of tokens for USDC/ETH token pair. USDC symbol and decimals hardcoded.
 * 
 * @param {String} poolAddress Pool address of USDC/ETH token pair on Uniswap
 * @return {Contract} Contract instance of Quoter
 * @return {String} Token symbol for USDC
 * @return {String} Token symbol for ETH
 * @return {Number} Token decimals for USDC
 * @return {Number} Token decimals for ETH
 * @return {var} Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
*/
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

    const tokenAddress1 = await poolContract.token1(); // ETH

    const tokenAbi1 = await getAbi(tokenAddress1) // ETH

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

/**
 * Initializes Quoter instance and Contract instances of tokens for WBTC/USDC token pair. USDC symbol and decimals hardcoded.
 * 
 * @param {String} poolAddress Pool address of WBTC/USDC token pair on Uniswap
 * @return {Contract} Contract instance of Quoter
 * @return {String} Token symbol for WBTC
 * @return {String} Token symbol for USDC
 * @return {Number} Token decimals for WBTC
 * @return {Number} Token decimals for USDC
 * @return {var} Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
*/
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

    const tokenAbi0 = await getAbi(tokenAddress0) // WBTC

    const tokenContract0 = new ethers.Contract(
        tokenAddress0,
        tokenAbi0,
        provider
    )

    const tokenSymbol1 = 'USDC'
    const tokenSymbol0 = await tokenContract0.symbol()
    const tokenDecimals1 = 6
    const tokenDecimals0 = await tokenContract0.decimals()

    const immutables = await getPoolImmutables(poolContract)

    return [quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables]
}

/**
 * Queries Uniswap to get price of token. To be used after initializing Quoter and Contracts for token pairs.
 * Cannot be used with token pairs where token0 is USDC.
 * 
 * @param {Contract} quoterContract Instance of Quoter Contract
 * @param {Number} tokenDecimals0 Decimals for token0
 * @param {Number} tokenDecimals1 Decimals for token1
 * @param {var} immutables Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
 * @return {Contract} Amount of token1 per token0
*/
const getPrice = async(quoterContract, tokenDecimals0, tokenDecimals1, immutables) => {

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

    return amountOut
}

/**
 * Queries Uniswap to get price of ETH in USDC. To be used after initializing Quoter and Contracts for token pair using initQuoterAndTokenPairsUsdcEth()
 * 
 * @param {Contract} quoterContract Instance of Quoter Contract
 * @param {Number} tokenDecimals0 Decimals for USDC
 * @param {Number} tokenDecimals1 Decimals for ETH
 * @param {var} immutables Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
 * @return {Contract} Amount of USDC per ETH
*/
const getPriceUsdcEth = async(quoterContract, tokenDecimals0, tokenDecimals1, immutables) => {

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

    return outputAmount
}

/**
 * Get current one minute candlestick (open, high, low, close prices) by querying prices from Uniswap every 3s, then push to cloud sql database.
 * 
 * @param {Contract} quoterContract Instance of Quoter Contract
 * @param {Number} tokenSymbol0 Symbol for token0
 * @param {Number} tokenSymbol1 Symbol for token1
 * @param {Number} tokenDecimals0 Decimals for token0
 * @param {Number} tokenDecimals1 Decimals for token1
 * @param {var} immutables Dict containing immutables token_symbol0, token_symbol1 and fee for ease of querying prices
 * @param {Function} getPrice Function used to query price of token from Uniswap
 * @param {Function} sqlTableName Name of table in database instance to store candlestick
*/
const getCandlesticks = async(quoterContract, tokenSymbol0, tokenSymbol1, tokenDecimals0, tokenDecimals1, immutables, getPrice, sqlTableName) => {
    
    startDelay()
    setInterval(function() {
        let dateTime = new Date()
        let open, close, high, low
        let done = false
        
        let loop = setInterval(function() {
            getPrice(quoterContract, tokenDecimals0, tokenDecimals1, immutables).then(currPrice => {
                if (!done && new Date() - dateTime >= 60000) {
                    // Set close price, clear timeout and return values
                    done = true // prevents asynchronous calls from returning candlestick more than once

                    clearInterval(loop)
                    if (currPrice > high) {
                        // Set high price
                        high = currPrice
                    }

                    if (currPrice < low) {
                        // Set low price
                        low = currPrice
                    }
                    close = currPrice
                    
                    console.log(`${tokenSymbol0} PRICE CANDLESTICK`)
                    console.log(`DateTime: ${dateTime.toLocaleString()}`)
                    console.log(`Open: ${open} ${tokenSymbol1}`)
                    console.log(`High: ${high} ${tokenSymbol1}`)
                    console.log(`Low: ${low} ${tokenSymbol1}`)
                    console.log(`Close: ${close} ${tokenSymbol1}`)
                    pushCandlestickToDatabase(sqlTableName, dateTime, open, high, low, close)
                    console.log('=====================================================================')
                    
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
            })
        }, 3000); // Every 3s
    }, 60000) // Every 60s
}

/**
 * Used to delay runtime such that first price is queried at the start of the minute. 
*/
function startDelay() {
    console.log(`Pulling prices...`)
    while(new Date().getSeconds() != 0) {
        
    }
    console.log(`Time start: ${new Date().toLocaleString()}`)
}

/**
 * Pushes candlestick to a table in the connected database.
 * 
 * @param {String} tableName Name of table in database instance
 * @param {Date} timestamp Timestamp for candlestick
 * @param {Number} open Open price
 * @param {Number} high High price
 * @param {Number} low Low price
 * @param {Number} close Close price
*/
async function pushCandlestickToDatabase(tableName, timestamp, open, high, low, close) {
    await pool.query(
    'INSERT INTO ' + tableName + ' (timestamp, open, high, low, close) VALUES (?, ?, ?, ?, ?)'
    , [timestamp, open, high, low, close], (err, result) => {
        if(err) {
            throw err;
        } else {
            console.log(result);
            console.log(`Pushed candlestick to table ${tableName}`)
        }
    })
}

/******************  MAIN ******************/

// Pull prices for WBTC/ETH
initQuoterAndTokenPairs(poolAddressWbtcEth).then(result => {
    let [quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth] = result
    getCandlesticks(quoterContractWbtcEth, tokenSymbol0WbtcEth, tokenSymbol1WbtcEth, tokenDecimals0WbtcEth, tokenDecimals1WbtcEth, immutablesWbtcEth, getPrice, "WBTCETH")
})

// Pull prices for USDC/ETH
initQuoterAndTokenPairsUsdcEth(poolAddressUsdcEth).then(result => {
    let [quoterContractUsdcEth, tokenSymbol0UsdcEth, tokenSymbol1UsdcEth, tokenDecimals0UsdcEth, tokenDecimals1UsdcEth, immutablesUsdcEth] = result
    getCandlesticks(quoterContractUsdcEth, tokenSymbol1UsdcEth, tokenSymbol0UsdcEth, tokenDecimals0UsdcEth, tokenDecimals1UsdcEth, immutablesUsdcEth, getPriceUsdcEth, "USDCETH")
})

// Pull prices for WBTC/USDC
initQuoterAndTokenPairsWbtcUsdc(poolAddressWbtcUsdc).then(result => {
    let [quoterContractWbtcUsdc, tokenSymbol0WbtcUsdc, tokenSymbol1WbtcUsdc, tokenDecimals0WbtcUsdc, tokenDecimals1WbtcUsdc, immutablesWbtcUsdc] = result
    getCandlesticks(quoterContractWbtcUsdc, tokenSymbol0WbtcUsdc, tokenSymbol1WbtcUsdc, tokenDecimals0WbtcUsdc, tokenDecimals1WbtcUsdc, immutablesWbtcUsdc, getPrice, "WBTCUSDC")
})