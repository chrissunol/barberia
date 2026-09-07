export function formatUsPhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (local.length !== 10) return value?.trim() || 'Sin teléfono';

  return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
