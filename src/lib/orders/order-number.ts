const orderNumberPrefix = "NEVADA";
const hashLength = 5;

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0)
    .toString(36)
    .toUpperCase()
    .padStart(hashLength, "0")
    .slice(-hashLength);
}

export function createNevadaOrderNumber(seed: string) {
  const suffix = hashSeed(seed);

  return `${orderNumberPrefix}-${suffix}`;
}

export function getOrderNumberForExport(order: {
  id: string;
  idempotency_key: string | null;
  order_number: string | null;
}) {
  const storedOrderNumber = order.order_number?.trim();

  if (storedOrderNumber) {
    return storedOrderNumber;
  }

  return createNevadaOrderNumber(order.idempotency_key ?? order.id);
}
