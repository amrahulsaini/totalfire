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
}

class PushService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
    'totalfire_alerts',
    'Total Fire Alerts',
    description: 'Tournament, wallet, and withdrawal updates',
    importance: Importance.high,
  );

  static bool _initialized = false;

  static Future<void> initialize({bool syncWithBackend = false}) async {
    if (_initialized || kIsWeb) {
      return;
    }

    final messaging = FirebaseMessaging.instance;

    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidInit);
    await _localNotifications.initialize(settings: settings);

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    messaging.onTokenRefresh.listen((token) {
      if (token.isNotEmpty) {
        ApiService.registerPushToken(token: token);
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
    final notification = message.notification;
    if (notification == null) {
      return;
    }

    await _localNotifications.show(
      id: notification.hashCode,
      title: notification.title ?? 'Total Fire',
      body: notification.body ?? '',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'totalfire_alerts',
          'Total Fire Alerts',
          channelDescription: 'Tournament, wallet, and withdrawal updates',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
    );
  }
}
