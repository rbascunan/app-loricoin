// LoriCoin mascot images - Using blob URLs directly for transparent backgrounds
export const LORICOIN_IMAGES = {
  // Lorito con moneda - para LoriCoins y ganancias
  coin: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-eWQ81N1ccvnsarEfoNAUNm11KT9jF1.png",
  
  // Lorito con bolsas de compras - para gastos y premios
  shopping: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-0YM8FRzAsSjD0v0Q8IgNkNyVfOBSCy.png",
  
  // Lorito con birrete, lupa y metricas - para LorIA y educacion
  learning: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-SnAFpjcrbsaJ226JQWNB1nzoC5Juhz.png",
  
  // Lorito con chanchito azul - para ahorros
  savings: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-uJzUZOyT5o7PDCfPs8N2cOwutBMQ5I.png",
  
  // Lorito con baul del tesoro - para balance y saldos
  treasure: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-sXd9VlkL1GwYDi1vRvWN7tSVbKY0FZ.png",
  
  // Collage de 5 loritos - para uso general
  collage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-HUcEmOoV19icXJRJbCiW3WB0naD9H8.png",
  
  // Stellar blockchain logo
  stellar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stellar-vqHCAbG6CKBCvEAusxnA5E4Hu0XcjS.avif",
}

// Map sections to their appropriate mascot
export const SECTION_MASCOTS = {
  dashboard: LORICOIN_IMAGES.treasure,    // Balance/saldos
  family: LORICOIN_IMAGES.collage,        // Familia (varios loritos)
  movements: LORICOIN_IMAGES.coin,        // Movimientos (moneda)
  loria: LORICOIN_IMAGES.learning,        // Educacion AI
  community: LORICOIN_IMAGES.collage,     // Comunidad
  loricoins: LORICOIN_IMAGES.coin,        // LoriCoins
  premios: LORICOIN_IMAGES.shopping,      // Premios/tienda
  savings: LORICOIN_IMAGES.savings,       // Ahorros (chanchito)
}
