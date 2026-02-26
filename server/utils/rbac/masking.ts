/**
 * 資料遮蔽工具 (ST002 Z 軸)
 * 對敏感資料欄位進行遮蔽處以便顯示。
 */

/**
 * 遮蔽台灣手機號碼。
 * 例如："0912345678" -> "0912***678"
 */
export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 10) return "***";
  return `${mobile.slice(0, 4)}***${mobile.slice(7)}`;
}

/**
 * 遮蔽電子郵件地址。
 * 例如："user@example.com" -> "us****@example.com"
 */
export function maskEmail(email: string): string {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visibleCount = Math.min(2, local.length);
  const masked = local.slice(0, visibleCount) + "****";
  return `${masked}@${domain}`;
}

/**
 * 遮蔽 LINE ID。
 * 例如："my_line_id" -> "my****"
 */
export function maskLineId(lineId: string): string {
  if (!lineId) return "***";
  const visibleCount = Math.min(2, lineId.length);
  return lineId.slice(0, visibleCount) + "****";
}

/**
 * 遮蔽地址。
 * 例如："台北市信義區信義路五段7號" -> "台北市信義區..."
 */
export function maskAddress(address: string): string {
  if (!address) return "***";
  // 顯示前 5 個字元後進行遮蔽
  const visibleCount = Math.min(5, address.length);
  return address.slice(0, visibleCount) + "...";
}

/**
 * 遮蔽電話號碼 (邏輯與手機相同)。
 */
export function maskPhone(phone: string): string {
  return maskMobile(phone);
}

/**
 * 獲取指定敏感欄位的遮蔽函數。
 */
export function getMaskFunction(field: string): (value: string) => string {
  switch (field) {
    case "mobile":
      return maskMobile;
    case "email":
      return maskEmail;
    case "lineId":
      return maskLineId;
    case "address":
      return maskAddress;
    case "emergencyContactPhone":
      return maskPhone;
    default:
      return (val: string) => val;
  }
}
