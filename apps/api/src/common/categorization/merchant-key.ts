export function getMerchantKey(
  merchantName: string | null | undefined,
  description: string,
) {
  const label = merchantName?.trim() || description.trim();
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}
