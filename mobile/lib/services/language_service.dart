import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_localization.dart';
import 'api_service.dart';

class LanguageService {
  static const String _languageKey = 'app_language';
  static const String _languageSelectedKey = 'app_language_selected';

  static final ValueNotifier<Locale> localeNotifier =
      ValueNotifier(const Locale(AppLocalization.defaultLanguageCode));

  static bool _initialized = false;

  static bool _isSupportedLanguage(String code) =>
      code == 'en' || code == 'hi';

  static Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final savedCode = prefs.getString(_languageKey);
    if (savedCode != null && _isSupportedLanguage(savedCode)) {
      localeNotifier.value = Locale(savedCode);
    }

    _initialized = true;
  }

  static String get currentLanguageCode => localeNotifier.value.languageCode;

  static Future<bool> hasSelectedLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_languageSelectedKey) ?? false;
  }

  static Future<void> setLanguage(
    String languageCode, {
    bool markSelected = true,
    bool syncCloud = true,
  }) async {
    if (!_isSupportedLanguage(languageCode)) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, languageCode);
    if (markSelected) {
      await prefs.setBool(_languageSelectedKey, true);
    }

    localeNotifier.value = Locale(languageCode);

    if (syncCloud) {
      await ApiService.saveLanguagePreference(languageCode);
    }
  }

  static Future<void> syncWithCloudIfLoggedIn() async {
    final loggedIn = await ApiService.isLoggedIn();
    if (!loggedIn) {
      return;
    }

    final cloudLanguage = await ApiService.getLanguagePreferenceFromCloud();
    if (cloudLanguage != null && _isSupportedLanguage(cloudLanguage)) {
      await setLanguage(
        cloudLanguage,
        markSelected: true,
        syncCloud: false,
      );
      return;
    }

    await ApiService.saveLanguagePreference(currentLanguageCode);
  }
}
