import "server-only"
import {
  burnLoricoins,
  getAuthoritySolBalance,
  getLoricoinBalance,
  getSignatureOutcome,
  mintLoricoins,
} from "@/lib/solana"
import type { SolanaPort } from "./task-service"

export const solanaPort: SolanaPort = {
  authoritySol: getAuthoritySolBalance,
  mint: mintLoricoins,
  burn: burnLoricoins,
  balance: getLoricoinBalance,
  signatureOutcome: getSignatureOutcome,
}
