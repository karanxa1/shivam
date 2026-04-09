import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// Reusable FinManager logo widget.
/// Can display icon-only, text-only, or icon+text.
class AppLogo extends StatelessWidget {
  final double iconSize;
  final double? textSize;
  final bool showText;
  final bool showIcon;

  const AppLogo({
    super.key,
    this.iconSize = 48,
    this.textSize,
    this.showText = true,
    this.showIcon = true,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveTextSize = textSize ?? (iconSize * 0.45);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showIcon) ...[
          Container(
            width: iconSize,
            height: iconSize,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(iconSize * 0.25),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                  blurRadius: iconSize * 0.4,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(iconSize * 0.25),
              child: Image.asset(
                'assets/images/app_icon.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
          if (showText) SizedBox(width: iconSize * 0.25),
        ],
        if (showText)
          RichText(
            text: TextSpan(
              style: TextStyle(
                fontSize: effectiveTextSize,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
              children: const [
                TextSpan(
                  text: 'Fin',
                  style: TextStyle(color: AppTheme.primaryYellow),
                ),
                TextSpan(
                  text: 'Manager',
                  style: TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
