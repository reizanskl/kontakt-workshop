export type Device = 'phone' | 'laptop' | 'other';
export type Lead = { name: string; phone: string; device: Device; problem: string };
export type FieldErrors = Partial<Record<'name' | 'phone' | 'device' | 'problem', string>>;
export const deviceNames: Record<Device, string> = { phone: 'Смартфон', laptop: 'Ноутбук', other: 'Другое устройство' };
const plain = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function validateLead(value: unknown): { lead?: Lead; errors: FieldErrors } {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const name = plain(data.name).replace(/\s+/g, ' ');
  const phoneInput = plain(data.phone);
  const digits = phoneInput.replace(/\D/g, '');
  const problem = plain(data.problem);
  const device = data.device as Device;
  const errors: FieldErrors = {};
  if (name.length < 2 || name.length > 60 || /[\u0000-\u001f<>]/.test(name)) errors.name = 'Укажите имя: от 2 до 60 символов.';
  if (!/^[+\d\s().-]+$/.test(phoneInput) || digits.length < 10 || digits.length > 15 || phoneInput.length > 30) errors.phone = 'Укажите телефон: от 10 до 15 цифр.';
  if (!Object.hasOwn(deviceNames, device)) errors.device = 'Выберите устройство.';
  if (problem.length < 10 || problem.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(problem)) errors.problem = 'Опишите проблему: от 10 до 1000 символов.';
  if (Object.keys(errors).length) return { errors };
  let phone = digits;
  if (digits.length === 11 && digits.startsWith('8')) phone = '7' + digits.slice(1);
  return { errors, lead: { name, phone: '+' + phone, device, problem } };
}
