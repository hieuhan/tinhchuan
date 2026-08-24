/**
 * Định dạng chuỗi ngày từ 'YYYY-MM-DD' → 'DD/MM/YYYY'
 * Nếu định dạng không hợp lệ, trả về chuỗi gốc.
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Định dạng số tiền VNĐ sang chuỗi có dấu chấm phân cách theo locale Việt Nam
 * Ví dụ: 1000000000 → "1.000.000.000"
 */
export function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN');
}
