export type TokenType = 'SOL' | 'USDT' | 'USDC'

export interface TokenInfo {
  symbol: TokenType
  name: string
  requiresExtraSOL: boolean
  solFeeAmount: number
  description: string
  icon: string
}

export const SUPPORTED_TOKENS: Record<TokenType, TokenInfo> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    requiresExtraSOL: false,
    solFeeAmount: 0,
    description: 'Native Solana token - no extra fees needed',
    icon: '⚡'
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    requiresExtraSOL: true,
    solFeeAmount: 0.01,
    description: 'Stablecoin pegged to USD',
    icon: '💚'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    requiresExtraSOL: true,
    solFeeAmount: 0.01,
    description: 'Regulated USD stablecoin',
    icon: '🔵'
  }
}