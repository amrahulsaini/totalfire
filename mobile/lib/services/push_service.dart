import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase may already be initialized in some runtimes.
  }

  // For data-only messages, render a local notification while app is in background.
  if (message.notification == null) {
    await PushService.showFromRemoteMessage(message);
  }
}

class PushService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const String _androidChannelId = 'totalfire_alerts_v2';
  static const String _androidChannelName = 'Total Fire Alerts';
  static const String _androidChannelDescription =
      'Tournament, wallet, and withdrawal updates';

  static const AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
    _androidChannelId,
    _androidChannelName,
    description: _androidChannelDescription,
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static bool _initialized = false;
  static bool _localNotificationsReady = false;

  static Future<void> _ensureLocalNotificationsReady() async {
    if (_localNotificationsReady || kIsWeb) {
      return;
    }

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidInit);
    await _localNotifications.initialize(settings: settings);

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    _localNotificationsReady = true;
  }

  static Future<void> initialize({bool syncWithBackend = false}) async {
    if (_initialized || kIsWeb) {
      return;
    }

    final messaging = FirebaseMessaging.instance;

    await messaging.setAutoInitEnabled(true);

    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    await _ensureLocalNotificationsReady();

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    messaging.onTokenRefresh.listen((token) {
      if (token.isNotEmpty) {
        unawaited(ApiService.registerPushToken(token: token));
      }
    });

    if (syncWithBackend) {
      await syncTokenWithBackend();
    }

    _initialized = true;
  }

  static Future<void> syncTokenWithBackend() async {
    if (kIsWeb) {
      return;
    }

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        await ApiService.registerPushToken(token: token);
      }
    } catch (_) {
      // Token sync failure is non-fatal for app flow.
    }
  }

  static Future<void> unregisterCurrentToken() async {
    if (kIsWeb) {
      return;
    }

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        await ApiService.deactivatePushToken(token);
      }
    } catch (_) {
      // Logout should proceed even if token cleanup fails.
    }
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    await showFromRemoteMessage(message);
  }

  static Future<void> showFromRemoteMessage(RemoteMessage message) async {
    if (kIsWeb) {
      return;
    }

    await _ensureLocalNotificationsReady();

    final notification = message.notification;
    final title =
        notification?.title ?? message.data['title']?.toString() ?? 'Total Fire';
    final body = notification?.body ??
        message.data['body']?.toString() ??
        message.data['message']?.toString() ??
        '';

    if (title.trim().isEmpty && body.trim().isEmpty) {
      return;
    }

    await _localNotifications.show(
      id: notification?.hashCode ?? DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannelId,
          _androidChannelName,
          channelDescription: _androidChannelDescription,
          importance: Importance.max,
          priority: Priority.max,
          playSound: true,
          enableVibration: true,
          icon: '@mipmap/ic_launcher',
        ),
      ),
    );
  }
}
