import { Keypair } from '@solana/web3.js'

export function generateEscrowWallet() {
  const escrowKeypair = Keypair.generate()
  return {
    publicKey: escrowKeypair.publicKey.toBase58(),
    secret: Buffer.from(escrowKeypair.secretKey).toString('hex')
  }
}
