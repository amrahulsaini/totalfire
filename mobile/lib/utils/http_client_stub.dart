import 'package:http/http.dart' as http;

/// Fallback / web implementation — plain client, browser handles DNS.
http.Client createHttpClient() => http.Client();
