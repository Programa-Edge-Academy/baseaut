export function passwordChecker(password: string): boolean {
  if (password.length < 8 || password.length > 20) return false;
  if(/[^\\A-Za-z0-9@$%!#&*?.,:;+-=*/^|~(){}<>_\"'`\[\]]/.test(password)) return false;
  return true;
}
