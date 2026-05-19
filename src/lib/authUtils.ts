export const EMPLOYEE_EMAIL_DOMAIN = "imperiopos.local";

export function toEmployeeEmail(username: string): string {
  return `${username.toLowerCase().trim()}@${EMPLOYEE_EMAIL_DOMAIN}`;
}

export function fromEmployeeEmail(email: string): string {
  return email.split("@")[0];
}
