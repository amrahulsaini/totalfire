import 'package:http/http.dart' as http;
import 'doh_resolver.dart';

/// Mobile/desktop implementation — DoH-aware client for carrier DNS issues.
http.Client createHttpClient() => DoHAwareClient();
