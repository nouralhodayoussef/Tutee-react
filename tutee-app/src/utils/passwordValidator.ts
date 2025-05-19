export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8 || password.length > 18) {
    errors.push('Password must be between 8 and 18 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {    // <--- Add this line for digits
    errors.push('Password must include at least one number.');
  }
  if (!/[#$@.&%]/.test(password)) {
    errors.push('Password must include at least one special character (# $ @ . & %).');
  }

  return { valid: errors.length === 0, errors };
}
