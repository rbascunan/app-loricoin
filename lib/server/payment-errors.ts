/** La transacción fue enviada pero no sabemos si llegó: NO se puede volver a emitir hasta comprobarlo. */
export class PaymentPendingError extends Error {
  constructor(public signature: string) {
    super("La transacción todavía no se confirmó")
    this.name = "PaymentPendingError"
  }
}

/** La transacción definitivamente no se aplicó (rechazada, fallida o vencida): es seguro reintentar. */
export class SolanaTxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SolanaTxError"
  }
}

/** Falta o es inválida una variable de entorno. El mensaje nombra la variable, nunca su valor. */
export class SolanaConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SolanaConfigError"
  }
}
