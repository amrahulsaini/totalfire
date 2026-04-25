import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_models.dart';
import '../utils/http_client.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class _ApiResult {
  const _ApiResult({
    required this.statusCode,
    required this.data,
  });

  final int statusCode;
  final Map<String, dynamic> data;
}

class ApiService {
  static const String baseUrl = 'https://totalfire.in';

  // Shared HTTP client — on mobile uses DoH fallback for carrier DNS issues,
  // on web uses plain client (browser handles DNS natively).
  static final _client = createHttpClient();

  static Uri _buildUri(String path, [Map<String, String?>? query]) {
    return Uri.parse('$baseUrl$path').replace(
      queryParameters: {
        for (final entry in (query ?? const <String, String?>{}).entries)
          if (entry.value != null && entry.value!.isNotEmpty) entry.key: entry.value!,
      },
    );
  }

  static Map<String, dynamic> _decodeBody(String body) {
    if (body.isEmpty) return const {};
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
      return const {};
    } catch (_) {
      // Server returned HTML or non-JSON (e.g. 404/500 page)
      return const {};
    }
  }

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<_ApiResult> _request(
    String method,
    String path, {
    Map<String, String?>? query,
    Map<String, dynamic>? body,
    bool authorized = true,
  }) async {
    final uri = _buildUri(path, query);
    final headers = authorized ? await _headers() : {'Content-Type': 'application/json'};

    late final http.Response response;
    switch (method) {
      case 'GET':
        response = await _client.get(uri, headers: headers);
        break;
      case 'POST':
        response = await _client.post(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'PUT':
        response = await _client.put(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'PATCH':
        response = await _client.patch(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'DELETE':
        if (body == null) {
          response = await _client.delete(uri, headers: headers);
        } else {
          final req = http.Request('DELETE', uri);
          req.headers.addAll(headers);
          req.body = jsonEncode(body);
          final streamed = await _client.send(req);
          response = await http.Response.fromStream(streamed);
        }
        break;
      default:
        throw const ApiException('Unsupported request method');
    }

    return _ApiResult(
      statusCode: response.statusCode,
      data: _decodeBody(response.body),
    );
  }

  static String resolveAssetUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return '$baseUrl$path';
  }

  static Future<void> _persistLogin(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['token']?.toString() ?? '');
    await prefs.setString('user', jsonEncode(data['user'] ?? const {}));
  }

  static Future<ApiResponse> register({
    required String fullName,
    required String username,
    required String email,
    required String mobile,
    required String password,
  }) async {
    try {
      final result = await _request(
        'POST',
        '/api/auth/register',
        body: {
          'fullName': fullName,
          'username': username,
          'email': email,
          'mobile': mobile,
          'password': password,
        },
        authorized: false,
      );

      if (result.statusCode == 201) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Account created successfully',
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Registration failed (HTTP ${result.statusCode})',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: e is ApiException ? e.message : 'Server error: $e',
      );
    }
  }

  static Future<ApiResponse> login({
    required String login,
    required String password,
  }) async {
    try {
      final result = await _request(
        'POST',
        '/api/auth/login',
        body: {
          'login': login,
          'password': password,
        },
        authorized: false,
      );

      if (result.statusCode == 200) {
        await _persistLogin(result.data);
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Login successful',
          data: UserProfile.fromJson(
            result.data['user'] as Map<String, dynamic>? ?? const {},
          ),
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Login failed (HTTP ${result.statusCode})',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: e is ApiException ? e.message : 'Server error: $e',
      );
    }
  }

  static Future<ApiResponse> requestPasswordResetOtp({
    required String username,
  }) async {
    try {
      final result = await _request(
        'POST',
        '/api/auth/forgot-password/request',
        body: {
          'username': username,
        },
        authorized: false,
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'OTP sent successfully',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to send OTP',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: e is ApiException ? e.message : 'Server error: $e',
      );
    }
  }

  static Future<ApiResponse> verifyPasswordResetOtp({
    required String username,
    required String otp,
  }) async {
    try {
      final result = await _request(
        'POST',
        '/api/auth/forgot-password/verify',
        body: {
          'username': username,
          'otp': otp,
        },
        authorized: false,
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'OTP verified',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'OTP verification failed',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: e is ApiException ? e.message : 'Server error: $e',
      );
    }
  }

  static Future<ApiResponse> resetPasswordWithOtp({
    required String resetToken,
    required String newPassword,
  }) async {
    try {
      final result = await _request(
        'POST',
        '/api/auth/forgot-password/reset',
        body: {
          'resetToken': resetToken,
          'newPassword': newPassword,
        },
        authorized: false,
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Password updated successfully',
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Password reset failed',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: e is ApiException ? e.message : 'Server error: $e',
      );
    }
  }

  static Future<List<ModeCatalogItem>> getModes() async {
    final result = await _request('GET', '/api/modes');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load modes',
        statusCode: result.statusCode,
      );
    }

    final modes = result.data['modes'] as List<dynamic>? ?? const [];
    return modes
        .whereType<Map<String, dynamic>>()
        .map(ModeCatalogItem.fromJson)
        .toList();
  }

  static Future<ModeCatalogItem> getMode(String slug) async {
    final result = await _request('GET', '/api/modes/$slug');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load mode',
        statusCode: result.statusCode,
      );
    }

    return ModeCatalogItem.fromJson(
      result.data['mode'] as Map<String, dynamic>? ?? const {},
    );
  }

  static Future<AppVersionPolicy?> getVersionPolicy({
    required String installedVersion,
  }) async {
    try {
      final result = await _request(
        'GET',
        '/api/app/version-policy',
        query: {'version': installedVersion.trim()},
        authorized: false,
      );

      if (result.statusCode != 200) {
        return null;
      }

      return AppVersionPolicy.fromJson(result.data);
    } catch (_) {
      return null;
    }
  }

  static Future<List<TournamentSummary>> getTournaments({
    String? modeSlug,
    String? status,
    String? category,
  }) async {
    final result = await _request(
      'GET',
      '/api/tournaments',
      query: {
        'mode_slug': modeSlug,
        'status': status,
        'category': category,
      },
    );

    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load tournaments',
        statusCode: result.statusCode,
      );
    }

    final tournaments = result.data['tournaments'] as List<dynamic>? ?? const [];
    return tournaments
        .whereType<Map<String, dynamic>>()
        .map(TournamentSummary.fromJson)
        .toList();
  }

  static Future<TournamentDetail> getTournamentDetail(int tournamentId) async {
    final result = await _request('GET', '/api/tournaments/$tournamentId');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load tournament details',
        statusCode: result.statusCode,
      );
    }

    return TournamentDetail.fromJson(result.data);
  }

  static Future<List<TournamentSummary>> getMyTournaments({String? status}) async {
    final result = await _request(
      'GET',
      '/api/tournaments/my',
      query: {'status': status},
    );

    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load your tournaments',
        statusCode: result.statusCode,
      );
    }

    final tournaments = result.data['tournaments'] as List<dynamic>? ?? const [];
    return tournaments
        .whereType<Map<String, dynamic>>()
        .map(TournamentSummary.fromJson)
        .toList();
  }

  static Future<ApiResponse> joinTournament(
    int tournamentId, {
    int? preferredSlot,
    List<int>? preferredSlots,
    required String gameName,
  }) async {
    try {
      final normalizedPreferredSlots = (preferredSlots ??
              (preferredSlot != null ? [preferredSlot] : const <int>[]))
          .where((slot) => slot > 0)
          .toSet()
          .toList()
        ..sort();

      final result = await _request(
        'POST',
        '/api/tournaments',
        body: {
          'tournamentId': tournamentId,
          'gameName': gameName,
          'preferredSlot': preferredSlot,
          'preferredSlots': normalizedPreferredSlots,
          'seatCount': normalizedPreferredSlots.isEmpty
              ? 1
              : normalizedPreferredSlots.length,
        },
      );

      if (result.statusCode == 201) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Joined successfully',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Join failed',
        data: result.data,
      );
    } catch (error) {
      if (error is ApiException) {
        return ApiResponse(success: false, message: error.message);
      }
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<double> getWalletBalance() async {
    final result = await _request('GET', '/api/wallet');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load wallet balance',
        statusCode: result.statusCode,
      );
    }

    final value = result.data['balance'];
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static Future<ApiResponse> createWalletTopUp(double amount) async {
    try {
      final result = await _request(
        'POST',
        '/api/wallet/cashfree',
        body: {'amount': amount},
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Payment order created',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to create payment order',
        data: result.data,
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<ApiResponse> verifyWalletTopUp(Map<String, dynamic> paymentData) async {
    try {
      final result = await _request(
        'POST',
        '/api/wallet/verify',
        body: paymentData,
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Payment verified',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to verify payment',
        data: result.data,
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<ApiResponse> requestWithdrawal(double amount, String upiId) async {
    try {
      final result = await _request(
        'POST',
        '/api/wallet/withdraw',
        body: {
          'amount': amount,
          'upiId': upiId,
        },
      );

      if (result.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: result.data['message']?.toString() ?? 'Withdrawal requested',
          data: result.data,
        );
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to withdraw',
        data: result.data,
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<List<WalletTransactionItem>> getWalletTransactions() async {
    final result = await _request('GET', '/api/wallet/transactions');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load wallet transactions',
        statusCode: result.statusCode,
      );
    }

    final transactions = result.data['transactions'] as List<dynamic>? ?? const [];
    return transactions
        .whereType<Map<String, dynamic>>()
        .map(WalletTransactionItem.fromJson)
        .toList();
  }

  static Future<List<WithdrawalRequestItem>> getWithdrawalRequests() async {
    final result = await _request('GET', '/api/wallet/withdrawals');
    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load withdrawal requests',
        statusCode: result.statusCode,
      );
    }

    final withdrawals = result.data['withdrawals'] as List<dynamic>? ?? const [];
    return withdrawals
        .whereType<Map<String, dynamic>>()
        .map(WithdrawalRequestItem.fromJson)
        .toList();
  }

  static Future<List<LeaderboardEntryItem>> getLeaderboard({int limit = 100}) async {
    final result = await _request(
      'GET',
      '/api/leaderboard',
      query: {'limit': limit.toString()},
    );

    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load leaderboard',
        statusCode: result.statusCode,
      );
    }

    final leaders = result.data['leaders'] as List<dynamic>? ?? const [];
    return leaders
        .whereType<Map<String, dynamic>>()
        .map(LeaderboardEntryItem.fromJson)
        .toList();
  }

  static Future<NotificationsResult> getNotifications({int limit = 50}) async {
    final result = await _request(
      'GET',
      '/api/notifications',
      query: {'limit': limit.toString()},
    );

    if (result.statusCode != 200) {
      throw ApiException(
        result.data['error']?.toString() ?? 'Failed to load notifications',
        statusCode: result.statusCode,
      );
    }

    final notifications = result.data['notifications'] as List<dynamic>? ?? const [];
    return NotificationsResult(
      unreadCount: result.data['unreadCount'] is num
          ? (result.data['unreadCount'] as num).toInt()
          : int.tryParse(result.data['unreadCount']?.toString() ?? '0') ?? 0,
      items: notifications
          .whereType<Map<String, dynamic>>()
          .map(AppNotificationItem.fromJson)
          .toList(),
    );
  }

  static Future<ApiResponse> markAllNotificationsRead() async {
    try {
      final result = await _request(
        'PATCH',
        '/api/notifications',
        body: {'markAllRead': true},
      );

      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'All notifications marked as read');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to mark all read',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<ApiResponse> markNotificationRead(int notificationId, {bool isRead = true}) async {
    try {
      final result = await _request(
        'PATCH',
        '/api/notifications/$notificationId',
        body: {'isRead': isRead},
      );

      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'Notification updated');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to update notification',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<ApiResponse> deleteNotification(int notificationId) async {
    try {
      final result = await _request('DELETE', '/api/notifications/$notificationId');
      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'Notification deleted');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to delete notification',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static Future<ApiResponse> deleteAllNotifications() async {
    try {
      final result = await _request(
        'DELETE',
        '/api/notifications',
        body: {'deleteAll': true},
      );
      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'All notifications deleted');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to delete all notifications',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed. Check your network.',
      );
    }
  }

  static String _detectPushPlatform() {
    if (kIsWeb) {
      return 'web';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.android:
        return 'android';
      default:
        return 'android';
    }
  }

  static Future<ApiResponse> registerPushToken({
    required String token,
    String? platform,
    String? deviceId,
    String? appVersion,
  }) async {
    final cleanedToken = token.trim();
    if (cleanedToken.isEmpty) {
      return const ApiResponse(success: false, message: 'Invalid FCM token');
    }

    try {
      final result = await _request(
        'POST',
        '/api/push/token',
        body: {
          'fcmToken': cleanedToken,
          'platform': platform ?? _detectPushPlatform(),
          if (deviceId != null && deviceId.isNotEmpty) 'deviceId': deviceId,
          if (appVersion != null && appVersion.isNotEmpty) 'appVersion': appVersion,
        },
      );

      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'Push token registered');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to register push token',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed while registering push token.',
      );
    }
  }

  static Future<ApiResponse> deactivatePushToken(String token) async {
    final cleanedToken = token.trim();
    if (cleanedToken.isEmpty) {
      return const ApiResponse(success: false, message: 'Invalid FCM token');
    }

    try {
      final result = await _request(
        'DELETE',
        '/api/push/token',
        body: {'fcmToken': cleanedToken},
      );

      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'Push token deactivated');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to deactivate push token',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed while deactivating push token.',
      );
    }
  }

  static Future<String?> getLanguagePreferenceFromCloud() async {
    try {
      final result = await _request('GET', '/api/user/language');
      if (result.statusCode != 200) {
        return null;
      }

      final language = result.data['language']?.toString().toLowerCase();
      if (language == 'hi') {
        return 'hi';
      }
      if (language == 'en') {
        return 'en';
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<ApiResponse> saveLanguagePreference(String languageCode) async {
    final normalized = languageCode.trim().toLowerCase();
    if (normalized != 'en' && normalized != 'hi') {
      return const ApiResponse(success: false, message: 'Invalid language');
    }

    try {
      final result = await _request(
        'PUT',
        '/api/user/language',
        body: {'language': normalized},
      );

      if (result.statusCode == 200) {
        return const ApiResponse(success: true, message: 'Language saved');
      }

      return ApiResponse(
        success: false,
        message: result.data['error']?.toString() ?? 'Failed to save language',
      );
    } catch (_) {
      return const ApiResponse(
        success: false,
        message: 'Connection failed while saving language.',
      );
    }
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') != null;
  }

  static Future<Map<String, dynamic>?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  static Future<UserProfile?> getSavedUserProfile() async {
    final user = await getSavedUser();
    if (user == null) {
      return null;
    }
    return UserProfile.fromJson(user);
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }
}

class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;

  const ApiResponse({required this.success, required this.message, this.data});
}

class NotificationsResult {
  const NotificationsResult({required this.items, required this.unreadCount});

  final List<AppNotificationItem> items;
  final int unreadCount;
}
