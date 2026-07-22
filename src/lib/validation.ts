export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const salted = `tabler_${Math.abs(hash).toString(36)}_${password.length}`;
  return btoa(salted);
}

export function verifyPassword(password: string, hashed: string): boolean {
  return hashPassword(password) === hashed;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} boş ola bilməz`;
  }
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.length < min) {
    return `${fieldName} ən azı ${min} simvol olmalıdır`;
  }
  return null;
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | null {
  if (value.length > max) {
    return `${fieldName} ən çox ${max} simvol ola bilər`;
  }
  return null;
}

export function validatePrice(value: number): string | null {
  if (value <= 0) return 'Qiymət 0-dan böyük olmalıdır';
  if (!Number.isFinite(value)) return 'Yanlış qiymət';
  return null;
}

export function validateGuestCount(value: number): string | null {
  if (value < 1) return 'Qonaq sayı ən azı 1 olmalıdır';
  if (value > 100) return 'Qonaq sayı 100-dən çox ola bilməz';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return 'Yanlış telefon nömrəsi';
  }
  return null;
}
