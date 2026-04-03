import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

/// DNS-over-HTTPS aware HTTP client.
///
/// On Indian carrier networks (Jio, Airtel, BSNL) the OS DNS frequently
/// fails to resolve newly registered `.in` domains while Chrome succeeds
/// because Chrome uses its own built-in DoH resolver.
///
/// Strategy:
///   1. Try the normal request (OS carrier DNS – fast path, zero overhead).
///   2. On DNS failure detect via error message inspection.
///   3. Resolve the hostname via Cloudflare DoH at the raw IP 1.0.0.1
///      (no DNS needed to reach it – it's an IP literal).
///   4. Retry using dart:io's [HttpClient.connectionFactory] to inject the
///      resolved IP at the TCP layer while keeping the original URI hostname
///      for TLS SNI → certificate verification still passes correctly.
class DoHAwareClient extends http.BaseClient {
  final _inner = http.Client();
  final Map<String, String> _dnsCache = {};

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    try {
      return await _inner.send(request);
    } catch (e) {
      if (!_isDnsFailure(e)) rethrow;
      final ip = await _resolveViaDoH(request.url.host);
      if (ip == null) rethrow;
      _dnsCache[request.url.host] = ip;
      return await _retryWithIp(request, ip);
    }
  }

  @override
  void close() {
    _inner.close();
    super.close();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  Future<http.StreamedResponse> _retryWithIp(
    http.BaseRequest original,
    String resolvedIp,
  ) async {
    // connectionFactory provides the raw TCP socket; dart:io's HttpClient
    // still uses the URI's hostname for TLS SNI, so cert verification passes.
    final dartClient = HttpClient()
      ..connectionFactory = (uri, proxyHost, proxyPort) {
        final port = proxyPort ??
            (uri.hasPort ? uri.port : (uri.scheme == 'https' ? 443 : 80));
        return Socket.startConnect(resolvedIp, port);
      };
    final ioClient = IOClient(dartClient);
    try {
      return await ioClient.send(_cloneRequest(original));
    } finally {
      ioClient.close();
    }
  }

  /// Clone [req] so it can be re-sent (BaseRequest can only be sent once).
  http.BaseRequest _cloneRequest(http.BaseRequest req) {
    if (req is http.Request) {
      final clone = http.Request(req.method, req.url)
        ..headers.addAll(req.headers)
        ..body = req.body;
      return clone;
    }
    // Multipart / streamed requests are not used by ApiService.
    return req;
  }

  bool _isDnsFailure(Object e) {
    String msg = '';
    if (e is http.ClientException) msg = e.message;
    if (e is SocketException) msg = e.message;
    return msg.contains('Failed host lookup') ||
        msg.contains('No such host') ||
        msg.contains('errno = 7') ||
        (e is SocketException && e.osError?.errorCode == 7);
  }

  /// Queries Cloudflare's DoH at 1.0.0.1 (raw IP — no DNS bootstrap needed).
  Future<String?> _resolveViaDoH(String hostname) async {
    if (_dnsCache.containsKey(hostname)) return _dnsCache[hostname];

    HttpClient? client;
    try {
      client = HttpClient()
        ..connectionTimeout = const Duration(seconds: 8)
        // 1.0.0.1 has a valid TLS cert; this callback is a narrow safety net.
        ..badCertificateCallback =
            (cert, host, port) => host == '1.0.0.1' || host == '1.1.1.1';

      final req = await client.openUrl(
        'GET',
        Uri.parse(
          'https://1.0.0.1/dns-query?name=${Uri.encodeComponent(hostname)}&type=A',
        ),
      );
      req.headers
        ..add('Accept', 'application/dns-json')
        ..add('User-Agent', 'TotalFire/1.0');

      final res = await req.close();
      if (res.statusCode == 200) {
        final body = await res.transform(utf8.decoder).join();
        final data = jsonDecode(body) as Map<String, dynamic>;
        final answers = data['Answer'] as List<dynamic>?;
        if (answers != null) {
          for (final answer in answers) {
            if (answer is Map && answer['type'] == 1) {
              final ip = answer['data'] as String?;
              if (ip != null && ip.isNotEmpty) return ip;
            }
          }
        }
      }
    } catch (_) {
      // DoH failed too; caller will rethrow the original exception.
    } finally {
      client?.close();
    }
    return null;
  }
}
