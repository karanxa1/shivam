import type { Timestamp } from 'firebase/firestore';

// Format currency in INR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format currency compact (e.g., ₹1.5L, ₹2.3Cr)
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

// Format date short (e.g., "15 Jan 2024")
export function formatDateShort(date: Date | Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Format date full (e.g., "Monday, 15 January 2024")
export function formatDateFull(date: Date | Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Format month year (e.g., "January 2024")
export function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

// Get current month string (e.g., "2024-01")
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date | Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDateShort(d);
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Status color mapping
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'done':
    case 'completed':
      return 'bg-blue-500/15 text-blue-700 border-blue-500/25';
    case 'pending':
      return 'bg-sky-500/15 text-sky-700 border-sky-500/25';
    case 'inprogress':
    case 'in_progress':
    case 'inProgress':
      return 'bg-indigo-500/15 text-indigo-700 border-indigo-500/25';
    default:
      return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
  }
}

// Format status display text
export function formatStatus(status: string): string {
  switch (status) {
    case 'inProgress':
    case 'inprogress':
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    case 'done':
      return 'Done';
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
