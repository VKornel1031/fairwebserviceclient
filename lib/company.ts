/** Format validation only; this does not verify a company's identity with NAV. */
export const companyTaxPattern = "[0-9]{8}-[1-5]-[0-9]{2}";
export const companyTaxHint = "Magyar adószám, például: 12345678-2-19.";
export function normalizedCompanyTax(value: string) {
  const compact = value.trim().replace(/\s/g, "");
  return /^[0-9]{11}$/.test(compact)
    ? `${compact.slice(0, 8)}-${compact.slice(8, 9)}-${compact.slice(9)}`
    : compact;
}
export function validCompany(name: unknown, tax: unknown) {
  return (
    typeof name === "string" &&
    name.trim().length >= 2 &&
    name.trim().length <= 120 &&
    typeof tax === "string" &&
    new RegExp(`^${companyTaxPattern}$`).test(tax)
  );
}
