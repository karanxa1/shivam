import 'package:intl/intl.dart';

class Formatters {
  // Format currency to Indian Rupee
  static String currency(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }

  // Format currency with decimal places
  static String currencyWithDecimals(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }

  // Format currency compact (1.5K, 2.3L)
  static String currencyCompact(double amount) {
    if (amount >= 10000000) {
      return '₹${(amount / 10000000).toStringAsFixed(1)}Cr';
    } else if (amount >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(1)}L';
    } else if (amount >= 1000) {
      return '₹${(amount / 1000).toStringAsFixed(1)}K';
    } else {
      return '₹${amount.toStringAsFixed(0)}';
    }
  }

  // Format date to readable format
  static String date(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  // Format date short (e.g., 15 Jan)
  static String dateShort(DateTime date) {
    return DateFormat('dd MMM').format(date);
  }

  // Format date full
  static String dateFull(DateTime date) {
    return DateFormat('EEEE, dd MMMM yyyy').format(date);
  }

  // Format date with time
  static String dateTime(DateTime date) {
    return DateFormat('dd MMM yyyy, HH:mm').format(date);
  }

  // Format to month-year
  static String monthYear(DateTime date) {
    return DateFormat('MMMM yyyy').format(date);
  }

  // Format to month string for storage (YYYY-MM)
  static String monthString(DateTime date) {
    return DateFormat('yyyy-MM').format(date);
  }

  // Get current month string
  static String currentMonth() {
    return monthString(DateTime.now());
  }

  // Date group key (Today, Yesterday, or date)
  static String dateGroupKey(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == yesterday) {
      return 'Yesterday';
    } else if (date.year == now.year) {
      return DateFormat('dd MMMM').format(date);
    } else {
      return DateFormat('dd MMMM yyyy').format(date);
    }
  }

  // Format relative time (e.g., "2 days ago", "in 3 days")
  static String relativeTime(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now);

    if (difference.inDays > 0) {
      return 'in ${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'}';
    } else if (difference.inDays < 0) {
      final daysPast = difference.inDays.abs();
      return '$daysPast ${daysPast == 1 ? 'day' : 'days'} ago';
    } else if (difference.inHours > 0) {
      return 'in ${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'}';
    } else if (difference.inHours < 0) {
      final hoursPast = difference.inHours.abs();
      return '$hoursPast ${hoursPast == 1 ? 'hour' : 'hours'} ago';
    } else {
      return 'Today';
    }
  }

  // Format percentage
  static String percentage(double value) {
    return '${value.toStringAsFixed(1)}%';
  }

  // Format large numbers (e.g., 1.5K, 2.3M)
  static String compactNumber(double number) {
    if (number >= 10000000) {
      return '${(number / 10000000).toStringAsFixed(1)}Cr';
    } else if (number >= 100000) {
      return '${(number / 100000).toStringAsFixed(1)}L';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    } else {
      return number.toStringAsFixed(0);
    }
  }
}
