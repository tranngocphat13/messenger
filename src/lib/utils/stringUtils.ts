/**
 * Rút gọn văn bản theo độ dài chỉ định và thêm dấu chấm lửng.
 * @param text Văn bản cần rút gọn
 * @param limit Số ký tự tối đa
 * @returns Văn bản đã được xử lý
 */
export const truncateMessage = (text: string, limit: number = 50): string => {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + '...';
};
