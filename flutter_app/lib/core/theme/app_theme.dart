import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_app/core/models/user.dart';

class AppTheme {
  // Blue and white brand palette used by every screen.
  static const Color amoledBlack = Color(0xFFF8FBFF);
  static const Color darkSurface = Color(0xFFFFFFFF);
  static const Color darkCard = Color(0xFFFFFFFF);
  static const Color darkDivider = Color(0xFFD7E6FF);

  static const Color primaryYellow = Color(0xFF2563EB);
  static const Color accentYellow = Color(0xFF60A5FA);
  static const Color darkYellow = Color(0xFF1D4ED8);
  static const Color lightYellow = Color(0xFFDBEAFE);

  // Text colors
  static const Color darkTextPrimary = Color(0xFF0F172A);
  static const Color darkTextSecondary = Color(0xFF475569);
  static const Color darkTextTertiary = Color(0xFF64748B);

  static const Color lightTextPrimary = Color(0xFF000000);
  static const Color lightTextSecondary = Color(0xFF666666);
  static const Color lightTextTertiary = Color(0xFF999999);

  // ============ DARK THEME (Blue + White) ============
  static ThemeData darkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: amoledBlack,
      colorScheme: const ColorScheme.light(
        brightness: Brightness.light,
        primary: primaryYellow,
        onPrimary: Colors.white,
        primaryContainer: lightYellow,
        onPrimaryContainer: lightYellow,
        secondary: accentYellow,
        onSecondary: Colors.white,
        secondaryContainer: Color(0xFFEAF2FF),
        onSecondaryContainer: lightYellow,
        tertiary: darkYellow,
        onTertiary: Colors.white,
        error: Color(0xFF1E40AF),
        onError: Colors.white,
        surface: darkSurface,
        onSurface: darkTextPrimary,
        surfaceContainerHighest: darkCard,
        outline: darkDivider,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: amoledBlack,
        foregroundColor: darkTextPrimary,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: darkDivider, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkCard,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: darkDivider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: darkDivider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryYellow, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1E40AF)),
        ),
        labelStyle: const TextStyle(color: darkTextSecondary),
        hintStyle: const TextStyle(color: darkTextTertiary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryYellow,
          foregroundColor: amoledBlack,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryYellow,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: primaryYellow, width: 1.5),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryYellow,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryYellow,
        foregroundColor: amoledBlack,
        elevation: 4,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: amoledBlack,
        selectedItemColor: primaryYellow,
        unselectedItemColor: darkTextTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: amoledBlack,
        indicatorColor: primaryYellow.withValues(alpha: 0.2),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primaryYellow);
          }
          return const IconThemeData(color: darkTextTertiary);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              color: primaryYellow,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            );
          }
          return const TextStyle(color: darkTextTertiary, fontSize: 12);
        }),
      ),
      dividerTheme: const DividerThemeData(color: darkDivider, thickness: 1),
      chipTheme: ChipThemeData(
        backgroundColor: darkCard,
        selectedColor: primaryYellow.withValues(alpha: 0.2),
        labelStyle: const TextStyle(color: darkTextPrimary),
        side: BorderSide(color: darkDivider),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: darkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: darkCard,
        contentTextStyle: const TextStyle(color: darkTextPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryYellow,
        linearTrackColor: darkDivider,
        circularTrackColor: darkDivider,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryYellow;
          }
          return darkTextTertiary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryYellow.withValues(alpha: 0.3);
          }
          return darkDivider;
        }),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryYellow;
          }
          return Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(amoledBlack),
        side: const BorderSide(color: darkTextTertiary, width: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryYellow;
          }
          return darkTextTertiary;
        }),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: darkTextSecondary,
        textColor: darkTextPrimary,
      ),
      iconTheme: const IconThemeData(color: darkTextSecondary),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        displayMedium: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        displaySmall: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        headlineLarge: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        headlineSmall: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleLarge: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.w500,
        ),
        titleSmall: TextStyle(
          color: darkTextSecondary,
          fontWeight: FontWeight.w500,
        ),
        bodyLarge: TextStyle(color: darkTextPrimary),
        bodyMedium: TextStyle(color: darkTextSecondary),
        bodySmall: TextStyle(color: darkTextTertiary),
        labelLarge: TextStyle(
          color: darkTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        labelMedium: TextStyle(color: darkTextSecondary),
        labelSmall: TextStyle(color: darkTextTertiary),
      ),
    );
  }

  // ============ LIGHT THEME (Clean White + Blue) ============
  static ThemeData lightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: Colors.white,
      colorScheme: const ColorScheme.light(
        brightness: Brightness.light,
        primary: darkYellow,
        onPrimary: Colors.white,
        primaryContainer: lightYellow,
        onPrimaryContainer: Color(0xFF1E3A8A),
        secondary: primaryYellow,
        onSecondary: Colors.black,
        secondaryContainer: Color(0xFFEAF2FF),
        onSecondaryContainer: Color(0xFF1E3A8A),
        tertiary: accentYellow,
        onTertiary: Colors.black,
        error: Color(0xFF1E40AF),
        onError: Colors.white,
        surface: Colors.white,
        onSurface: lightTextPrimary,
        surfaceContainerHighest: Color(0xFFF8FBFF),
        outline: Color(0xFFD7E6FF),
      ),
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: lightTextPrimary,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FBFF),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD7E6FF)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD7E6FF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkYellow, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1E40AF)),
        ),
        labelStyle: const TextStyle(color: lightTextSecondary),
        hintStyle: const TextStyle(color: lightTextTertiary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: darkYellow,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkYellow,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: darkYellow, width: 1.5),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: darkYellow,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: darkYellow,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: darkYellow,
        unselectedItemColor: lightTextTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: darkYellow.withValues(alpha: 0.2),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: darkYellow);
          }
          return const IconThemeData(color: lightTextTertiary);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              color: darkYellow,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            );
          }
          return const TextStyle(color: lightTextTertiary, fontSize: 12);
        }),
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFD7E6FF),
        thickness: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFF8FBFF),
        selectedColor: darkYellow.withValues(alpha: 0.2),
        labelStyle: const TextStyle(color: lightTextPrimary),
        side: const BorderSide(color: Color(0xFFD7E6FF)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: const Color(0xFF333333),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: darkYellow,
        linearTrackColor: Color(0xFFD7E6FF),
        circularTrackColor: Color(0xFFD7E6FF),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return darkYellow;
          }
          return lightTextTertiary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return darkYellow.withValues(alpha: 0.3);
          }
          return const Color(0xFFD7E6FF);
        }),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return darkYellow;
          }
          return Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(Colors.white),
        side: const BorderSide(color: lightTextTertiary, width: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return darkYellow;
          }
          return lightTextTertiary;
        }),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: lightTextSecondary,
        textColor: lightTextPrimary,
      ),
      iconTheme: const IconThemeData(color: lightTextSecondary),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        displayMedium: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        displaySmall: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        headlineLarge: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        headlineSmall: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleLarge: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.w500,
        ),
        titleSmall: TextStyle(
          color: lightTextSecondary,
          fontWeight: FontWeight.w500,
        ),
        bodyLarge: TextStyle(color: lightTextPrimary),
        bodyMedium: TextStyle(color: lightTextSecondary),
        bodySmall: TextStyle(color: lightTextTertiary),
        labelLarge: TextStyle(
          color: lightTextPrimary,
          fontWeight: FontWeight.w600,
        ),
        labelMedium: TextStyle(color: lightTextSecondary),
        labelSmall: TextStyle(color: lightTextTertiary),
      ),
    );
  }

  // ============ HELPER METHODS ============

  // Get theme based on user role (all roles use same theme now, differentiated by layout)
  static ThemeData getThemeForRole(UserRole role, {bool isDark = true}) {
    return isDark ? darkTheme() : lightTheme();
  }

  // Common status colors
  static const Color successColor = Color(0xFF2563EB);
  static const Color warningColor = Color(0xFF60A5FA);
  static const Color errorColor = Color(0xFF1E40AF);
  static const Color infoColor = Color(0xFF3B82F6);

  // Budget status colors
  static Color getBudgetStatusColor(double percentage) {
    if (percentage < 70) return successColor;
    if (percentage < 90) return warningColor;
    return errorColor;
  }

  // Transaction type colors
  static Color getTransactionColor(String type, {bool isDark = true}) {
    switch (type.toLowerCase()) {
      case 'income':
        return successColor;
      case 'expense':
        return errorColor;
      default:
        return isDark ? darkTextSecondary : lightTextSecondary;
    }
  }

  // Project status colors
  static const Map<String, Color> projectStatusColors = {
    'pending': Color(0xFF60A5FA),
    'active': Color(0xFF2563EB),
    'completed': Color(0xFF1D4ED8),
  };

  // Task status colors
  static const Map<String, Color> taskStatusColors = {
    'pending': Color(0xFF60A5FA),
    'inProgress': Color(0xFF2563EB),
    'done': Color(0xFF1D4ED8),
  };

  // Payslip status colors
  static const Map<String, Color> payslipStatusColors = {
    'pending': Color(0xFF60A5FA),
    'paid': Color(0xFF1D4ED8),
  };

  // Role badge colors (subtle blue tints)
  static Color getRoleBadgeColor(UserRole role, {bool isDark = true}) {
    if (isDark) {
      return primaryYellow.withValues(alpha: 0.15);
    }
    return darkYellow.withValues(alpha: 0.1);
  }

  static Color getRoleTextColor(UserRole role, {bool isDark = true}) {
    return isDark ? primaryYellow : darkYellow;
  }
}

// Extension for easy theme access
extension ThemeExtension on BuildContext {
  ThemeData get theme => Theme.of(this);
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
  TextTheme get textTheme => Theme.of(this).textTheme;
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}
