import "server-only"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { SolanaConfigError } from "./payment-errors"

export interface EncryptedSecret {
  ciphertext: string
  iv: string
  auth_tag: string
}

function deriveKey(secret: string | undefined): Buffer {
  if (!secret) throw new SolanaConfigError("Falta WALLET_ENCRYPTION_KEY")
  return createHash("sha256").update(secret, "utf8").digest()
}

export function encryptSecret(plain: Uint8Array, secret = process.env.WALLET_ENCRYPTION_KEY): EncryptedSecret {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    auth_tag: cipher.getAuthTag().toString("base64"),
  }
}

export function decryptSecret(payload: EncryptedSecret, secret = process.env.WALLET_ENCRYPTION_KEY): Uint8Array {
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(payload.iv, "base64"))
  decipher.setAuthTag(Buffer.from(payload.auth_tag, "base64"))
  const plain = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()])
  return new Uint8Array(plain)
}
