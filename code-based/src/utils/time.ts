interface ValidationResult {
  ok: boolean;
  value?: number;
  error?: string;
}

export function parseAndValidate(
  value: string,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  const trimmed = value.trim();
  if (trimmed === '') {
    return { ok: false, error: `Please enter a value for ${fieldName}.` };
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: `${fieldName} must be a whole number.` };
  }
  const num = parseInt(trimmed, 10);
  if (num < min || num > max) {
    return {
      ok: false,
      error: `${fieldName} must be between ${min} and ${max}.`,
    };
  }
  return { ok: true, value: num };
}

export function minutesToHHMM(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '--:--';
  }
  const clamped = Math.max(0, Math.min(1440, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
