import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'l10n/app_localization.dart';
import 'models/app_models.dart';
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
  AppVersionPolicy? _requiredUpdatePolicy;
  String _appVersionLabel = '1.0.0';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final hasLanguageSelectionFuture = LanguageService.hasSelectedLanguage();
    final isLoggedInFuture = ApiService.isLoggedIn();

    String installedVersion = '1.0.0';
    String buildNumber = '';
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      installedVersion = packageInfo.version.trim().isEmpty
          ? installedVersion
          : packageInfo.version.trim();
      buildNumber = packageInfo.buildNumber.trim();
    } catch (_) {
      // Keep fallback version if package info is unavailable.
    }

    final versionPolicy = await ApiService.getVersionPolicy(
      installedVersion: installedVersion,
    );

    final hasLanguageSelection = await hasLanguageSelectionFuture;
    final isLoggedIn = await isLoggedInFuture;

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
      _requiredUpdatePolicy =
          versionPolicy != null && versionPolicy.requiresUpdate ? versionPolicy : null;
      _appVersionLabel = buildNumber.isEmpty
          ? installedVersion
          : '$installedVersion+$buildNumber';
    });
  }

  Future<void> _openUpdateLink() async {
    final policy = _requiredUpdatePolicy;
    if (policy == null) {
      return;
    }

    final uri = Uri.tryParse(policy.downloadUrl);
    if (uri == null) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Update link is invalid. Contact support.')),
      );
      return;
    }

    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open update link. Please try again.')),
      );
    }
  }

  Future<void> _retryVersionCheck() async {
    if (mounted) {
      setState(() => _isLoading = true);
    }
    await _bootstrap();
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

    if (_requiredUpdatePolicy != null) {
      return _ForceUpdateScreen(
        policy: _requiredUpdatePolicy!,
        installedVersion: _appVersionLabel,
        onUpdatePressed: _openUpdateLink,
        onRetryPressed: _retryVersionCheck,
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

class _ForceUpdateScreen extends StatelessWidget {
  const _ForceUpdateScreen({
    required this.policy,
    required this.installedVersion,
    required this.onUpdatePressed,
    required this.onRetryPressed,
  });

  final AppVersionPolicy policy;
  final String installedVersion;
  final Future<void> Function() onUpdatePressed;
  final Future<void> Function() onRetryPressed;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Icon(
                Icons.system_update_alt_rounded,
                size: 74,
                color: AppColors.accentRed,
              ),
              const SizedBox(height: 20),
              Text(
                policy.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                policy.message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.45,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Installed: $installedVersion'),
                    const SizedBox(height: 4),
                    Text('Latest: ${policy.latestVersion}'),
                    const SizedBox(height: 4),
                    Text('Minimum supported: ${policy.minSupportedVersion}'),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () => onUpdatePressed(),
                icon: const Icon(Icons.download_rounded),
                label: const Text('Update Now'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => onRetryPressed(),
                child: const Text('Retry Check'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
