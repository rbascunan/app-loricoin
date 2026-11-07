export const STORE_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "experiencias", label: "Experiencias" },
  { id: "juguetes", label: "Juguetes" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "deportes", label: "Deportes" },
  { id: "escolar", label: "Escolar" },
  { id: "golosinas", label: "Golosinas" },
] as const

export const categoryLabel = (id: string) => STORE_CATEGORIES.find((c) => c.id === id)?.label ?? id

export const DELIVERY_CONTACT = {
  name: "Betito Bascuñan",
  display: "+54 9 2617 17-6713",
  phone: "5492617176713",
}

export function deliveryWhatsAppUrl(childName: string, rewardName: string, redemptionId: string) {
  const code = redemptionId.slice(0, 8).toUpperCase()
  const text = `¡Hola Betito! Soy ${childName}. Canjeé "${rewardName}" con mis LoriCoins (código ${code}). ¿Coordinamos la entrega?`
  return `https://wa.me/${DELIVERY_CONTACT.phone}?text=${encodeURIComponent(text)}`
}
