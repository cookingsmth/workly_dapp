import { TokenType, SUPPORTED_TOKENS } from '../types/token'

export const getTokenInfo = (symbol: TokenType) => {
  return SUPPORTED_TOKENS[symbol]
}

export const calculateTotalCost = (amount: number, token: TokenType) => {
  const tokenInfo = getTokenInfo(token)
  const mainAmount = amount
  const feeAmount = tokenInfo.requiresExtraSOL ? tokenInfo.solFeeAmount : 0
  
  return {
    mainAmount,
    feeAmount,
    totalSOLRequired: token === 'SOL' ? mainAmount : feeAmount,
    hasAdditionalFees: tokenInfo.requiresExtraSOL
  }
}

export const formatTokenAmount = (amount: number, token: TokenType) => {
  if (token === 'SOL') {
    return `${amount} SOL`
  }
  return `${amount} ${token}`
}

export const getUSDValue = (amount: number, token: TokenType) => {
  const rates = { SOL: 180, USDT: 1, USDC: 1 }
  return amount * rates[token]
}