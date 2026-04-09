import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localization.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/language_service.dart';
import 'services/push_service.dart';
import 'screens/home_screen.dart';
import 'screens/language_selection_screen.dart';
import 'screens/login_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/register_screen.dart';
import 'widgets/three_dots_loader.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  if (!kIsWeb) {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await PushService.initialize(syncWithBackend: false);
    } catch (_) {
      // App can still run if Firebase is temporarily unavailable.
    }
  }

  await LanguageService.initialize();

  runApp(const TotalFireApp());
}

class TotalFireApp extends StatelessWidget {
  const TotalFireApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Locale>(
      valueListenable: LanguageService.localeNotifier,
      builder: (context, locale, _) {
        return MaterialApp(
          title: 'Total Fire',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.theme,
          locale: locale,
          supportedLocales: AppLocalization.supportedLocales,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const _AuthGate(),
          routes: {
            '/login': (context) => const LoginScreen(),
            '/forgot-password': (context) => const ForgotPasswordScreen(),
            '/register': (context) => const RegisterScreen(),
            '/home': (context) => const HomeScreen(),
          },
        );
      },
    );
  }
}

class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  bool _hasLanguageSelection = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final hasLanguageSelection = await LanguageService.hasSelectedLanguage();
    final isLoggedIn = await ApiService.isLoggedIn();

    if (isLoggedIn && hasLanguageSelection) {
      await LanguageService.syncWithCloudIfLoggedIn();
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _isLoading = false;
      _isLoggedIn = isLoggedIn;
      _hasLanguageSelection = hasLanguageSelection;
    });
  }

  Future<void> _onLanguageSelected() async {
    final isLoggedIn = await ApiService.isLoggedIn();
    if (isLoggedIn) {
      await LanguageService.syncWithCloudIfLoggedIn();
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _hasLanguageSelection = true;
      _isLoggedIn = isLoggedIn;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: ThreeDotsLoader()),
      );
    }

    if (!_hasLanguageSelection) {
      return LanguageSelectionScreen(onSelected: _onLanguageSelected);
    }

    if (_isLoggedIn) {
      return const HomeScreen();
    }

    return const LoginScreen();
  }
}
