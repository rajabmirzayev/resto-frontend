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
    .replace(/`/g, '&#x60;')
    .trim();
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} boş ola bilməz`;
  }
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.trim().length < min) {
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

// ===== Menu validations (mirrors tabler-back menu-service DTOs) =====

export const MENU_LIMITS = {
  nameMax: 100,
  descriptionMax: 500,
  iconMax: 50,
  priceIntegerDigits: 8,
  priceFractionDigits: 2,
  prepTimeMax: 10080,
  sortOrderMax: 10000,
  imageUrlMax: 512,
  imageMaxSizeBytes: 2 * 1024 * 1024,
} as const;

export const MENU_ICONS = [
  'soup', 'beef', 'salad', 'pizza', 'hamburger', 'sandwich', 'cup-soda', 'coffee', 'milk',
  'wine', 'martini', 'glass-water', 'beer', 'cake', 'cookie', 'donut', 'croissant', 'ice-cream-cone',
  'ice-cream-bowl', 'popcorn', 'apple', 'cherry', 'grape', 'carrot', 'fish', 'drumstick', 'egg',
  'chef-hat', 'utensils', 'utensils-crossed',
] as const;

export const MENU_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const CONTROL_CHAR_REGEX = /\p{Cc}/u;

export function hasControlCharacters(value: string): boolean {
  return CONTROL_CHAR_REGEX.test(value);
}

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function isValidLocalizedValue(value: string, max: number): boolean {
  return value.length <= max && !value.includes('\u0000');
}

export function isValidPrice(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  const s = String(value);
  if (s.includes('e') || s.includes('E')) return false;
  const [intPart, fracPart = ''] = s.split('.');
  return (
    intPart.replace(/^-/, '').length <= MENU_LIMITS.priceIntegerDigits &&
    fracPart.length <= MENU_LIMITS.priceFractionDigits
  );
}

export function isValidPrepTime(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= MENU_LIMITS.prepTimeMax;
}

export function isValidSortOrder(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= MENU_LIMITS.sortOrderMax;
}

export function isValidImageUrl(value: string): boolean {
  if (value.length > MENU_LIMITS.imageUrlMax) return false;
  return /^(https?:\/\/|\/)[^\p{Cc}]*$/u.test(value);
}

export function isValidIcon(value: string): boolean {
  return value.length <= MENU_LIMITS.iconMax && !hasControlCharacters(value);
}

export function isAllowedMenuImage(file: File): boolean {
  return (
    file.size <= MENU_LIMITS.imageMaxSizeBytes &&
    (MENU_IMAGE_TYPES as readonly string[]).includes(file.type)
  );
}

// ===== Table validations (mirrors tabler-back table-service DTOs) =====

export const TABLE_LIMITS = {
  tableNumberMin: 1,
  tableNumberMax: 9999,
  capacityMin: 1,
  capacityMax: 500,
  nameMax: 100,
  reservationNameMax: 100,
  phoneMax: 30,
  phoneMinDigits: 7,
  phoneMaxDigits: 15,
  notesMax: 500,
  guestCountMin: 1,
  guestCountMax: 100,
} as const;

const PHONE_CHAR_REGEX = /^[0-9+\-(). ]+$/;

export function hasValidPhoneChars(value: string): boolean {
  return value.length <= TABLE_LIMITS.phoneMax && PHONE_CHAR_REGEX.test(value);
}

export function hasValidPhoneDigits(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '').length;
  return digits >= TABLE_LIMITS.phoneMinDigits && digits <= TABLE_LIMITS.phoneMaxDigits;
}

export function isValidTableNumber(value: number): boolean {
  return Number.isInteger(value) && value >= TABLE_LIMITS.tableNumberMin && value <= TABLE_LIMITS.tableNumberMax;
}

export function isValidCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= TABLE_LIMITS.capacityMin && value <= TABLE_LIMITS.capacityMax;
}

export function isValidReservationPhone(value: string): boolean {
  return hasValidPhoneChars(value) && hasValidPhoneDigits(value);
}

export function isValidReservationTime(value: string): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time > Date.now();
}
