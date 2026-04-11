import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Check if a role string has management-level access (admin, hr, or legacy authority) */
export function isManagementRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'authority' || role === 'hr';
}
