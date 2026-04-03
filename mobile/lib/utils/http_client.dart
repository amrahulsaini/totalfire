import 'package:http/http.dart' as http;
import 'http_client_stub.dart'
    if (dart.library.io) 'http_client_mobile.dart' as impl;

/// Returns a platform-appropriate HTTP client.
/// - Mobile/desktop: DoHAwareClient (DNS-over-HTTPS fallback)
/// - Web: plain http.Client (browser handles DNS natively)
http.Client createHttpClient() => impl.createHttpClient();
