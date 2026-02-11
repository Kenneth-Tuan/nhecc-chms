/**
 * Data Masking Utilities (ST002 Z-axis)
 * Masks sensitive data fields for display.
 */

/**
 * Mask a Taiwan mobile number.
 * e.g. "0912345678" -> "0912***678"
 */
export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 10) return '***';
  return `${mobile.slice(0, 4)}***${mobile.slice(7)}`;
}

/**
 * Mask an email address.
 * e.g. "user@example.com" -> "us****@example.com"
 */
export function maskEmail(email: string): string {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visibleCount = Math.min(2, local.length);
  const masked = local.slice(0, visibleCount) + '****';
  return `${masked}@${domain}`;
}

/**
 * Mask a Line ID.
 * e.g. "my_line_id" -> "my****"
 */
export function maskLineId(lineId: string): string {
  if (!lineId) return '***';
  const visibleCount = Math.min(2, lineId.length);
  return lineId.slice(0, visibleCount) + '****';
}

/**
 * Mask an address.
 * e.g. "台北市信義區信義路五段7號" -> "台北市信義區..."
 */
export function maskAddress(address: string): string {
  if (!address) return '***';
  // Show first 5 characters then mask
  const visibleCount = Math.min(5, address.length);
  return address.slice(0, visibleCount) + '...';
}

/**
 * Mask a phone number (same as mobile).
 */
export function maskPhone(phone: string): string {
  return maskMobile(phone);
}

/**
 * Get the masking function for a given sensitive field.
 */
export function getMaskFunction(
  field: string,
): (value: string) => string {
  switch (field) {
    case 'mobile':
      return maskMobile;
    case 'email':
      return maskEmail;
    case 'lineId':
      return maskLineId;
    case 'address':
      return maskAddress;
    case 'emergencyContactPhone':
      return maskPhone;
    default:
      return (val: string) => val;
  }
}
