// Classroom yardımcı fonksiyonları

/**
 * Benzersiz 6 haneli classroom kodu oluşturur
 * Format: ABC123 (3 harf + 3 rakam)
 */
export const generateClassroomCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code = '';
  
  // 3 harf ekle
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 rakam ekle
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
};

/**
 * Davet son kullanma tarihi oluşturur
 * @param days - Kaç gün sonra sona erecek (varsayılan: 30)
 */
export const createInvitationExpiry = (days: number = 30): Date => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};











