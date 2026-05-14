import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'core/firebase/auth_service.dart';
import 'core/firebase/firestore_service.dart';
import 'core/providers/auth_provider.dart';
import 'core/services/notification_service.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style for AMOLED black
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: AppTheme.amoledBlack,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase
  // The google-services Gradle plugin auto-initializes Firebase natively.
  // Calling initializeApp() without options attaches to that instance.
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    // Already initialized natively by google-services plugin
    if (e.toString().contains('duplicate-app')) {
      await Firebase.initializeApp();
    }
  }

  // Initialize local notification service
  await NotificationService.initialize();

  runApp(const FinanceApp());
}

class FinanceApp extends StatelessWidget {
  const FinanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Create services
    final authService = AuthService();
    final firestoreService = FirestoreService();

    return MultiProvider(
      providers: [
        // Auth Provider
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            authService: authService,
            firestoreService: firestoreService,
          ),
        ),
        // Provide services directly if needed elsewhere
        Provider<AuthService>.value(value: authService),
        Provider<FirestoreService>.value(value: firestoreService),
      ],
      child: const AppRoot(),
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  late final AppRouter _appRouter;

  @override
  void initState() {
    super.initState();
    _appRouter = AppRouter();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        return MaterialApp.router(
          title: 'FinManager',
          debugShowCheckedModeBanner: false,

          // Theme configuration - Blue + White
          theme: AppTheme.lightTheme(),
          darkTheme: AppTheme.darkTheme(),
          themeMode: ThemeMode.light,
          // Router configuration
          routerConfig: _appRouter.router(authProvider),
        );
      },
    );
  }
}
