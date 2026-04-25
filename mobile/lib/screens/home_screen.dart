// ignore_for_file: deprecated_member_use

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfdropcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/api/cftheme/cftheme.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentcomponents/cfpaymentcomponent.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_localization.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../services/push_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';
import '../widgets/three_dots_loader.dart';
import 'category_modes_screen.dart';
import 'leaderboard_screen.dart';
import 'notifications_screen.dart';
import 'payments_screen.dart';
import 'tournament_detail_screen.dart';
import 'withdrawal_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final CFPaymentGatewayService _cfPaymentGatewayService = CFPaymentGatewayService();
  final TextEditingController _walletAmountController =
      TextEditingController(text: '100');

  UserProfile? _user;
  double _walletBalance = 0;
  List<ModeCatalogItem> _modes = const [];
  List<TournamentSummary> _myTournaments = const [];
  List<WalletTransactionItem> _transactions = const [];
  int _unreadNotifications = 0;

  int _currentIndex = 0;
  String _selectedMyStatus = 'upcoming';
  bool _isLoading = true;
  bool _isWalletBusy = false;
  String? _pendingWalletOrderId;
  String _appVersionLabel = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _cfPaymentGatewayService.setCallback(_handlePaymentSuccess, _handlePaymentError);
    _loadAppVersion();
    _loadDashboard();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _walletAmountController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(PushService.syncTokenWithBackend());
      unawaited(_refreshNotificationsCount());
    }
  }

  List<TournamentSummary> get _filteredMyTournaments {
    return _myTournaments
        .where((tournament) => tournament.status == _selectedMyStatus)
        .toList();
  }

  Future<void> _loadDashboard({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final user = await ApiService.getSavedUserProfile();
      if (user == null) {
        await _forceLogout();
        return;
      }

      final walletBalance = await ApiService.getWalletBalance();
      final modes = await ApiService.getModes();
      final myTournaments = await ApiService.getMyTournaments();
      final transactions = await ApiService.getWalletTransactions();
      final notifications = await ApiService.getNotifications(limit: 20);

      if (!mounted) {
        return;
      }

      setState(() {
        _user = user;
        _walletBalance = walletBalance;
        _modes = modes;
        _myTournaments = myTournaments;
        _transactions = transactions;
        _unreadNotifications = notifications.unreadCount;
      });

      unawaited(PushService.syncTokenWithBackend());
      unawaited(LanguageService.syncWithCloudIfLoggedIn());
    } catch (error) {
      if (error is ApiException && error.statusCode == 401) {
        await _forceLogout(message: error.message);
        return;
      }

      if (!mounted) {
        return;
      }

      _showMessage(error.toString(), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _refreshWalletData() async {
    try {
      final walletBalance = await ApiService.getWalletBalance();
      final transactions = await ApiService.getWalletTransactions();
      if (!mounted) {
        return;
      }

      setState(() {
        _walletBalance = walletBalance;
        _transactions = transactions;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.toString(), isError: true);
    }
  }

  Future<void> _refreshNotificationsCount() async {
    try {
      final result = await ApiService.getNotifications(limit: 20);
      if (!mounted) {
        return;
      }

      setState(() => _unreadNotifications = result.unreadCount);
    } catch (_) {
      // Keep previous badge count if refresh fails.
    }
  }

  Future<void> _refreshModesData() async {
    try {
      final walletBalance = await ApiService.getWalletBalance();
      final modes = await ApiService.getModes();
      if (!mounted) {
        return;
      }

      setState(() {
        _walletBalance = walletBalance;
        _modes = modes;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.toString(), isError: true);
    }
  }

  Future<void> _refreshMyMatches() async {
    try {
      final tournaments = await ApiService.getMyTournaments();
      if (!mounted) {
        return;
      }

      setState(() => _myTournaments = tournaments);
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.toString(), isError: true);
    }
  }

  void _handlePaymentSuccess(String orderId) async {
    final paymentId = '';
    final signature = '';

    if (orderId.isEmpty) {
      _showMessage('Payment data missing. Please contact support.', isError: true);
      return;
    }

    setState(() => _isWalletBusy = true);
    final verifyResponse = await ApiService.verifyWalletTopUp({
      'Cashfree_order_id': orderId,
      'Cashfree_payment_id': paymentId,
      'Cashfree_signature': signature,
    });

    if (!mounted) {
      return;
    }

    setState(() => _isWalletBusy = false);

    if (!verifyResponse.success) {
      _showMessage(verifyResponse.message, isError: true);
      return;
    }

    setState(() {
      _pendingWalletOrderId = null;
      _walletAmountController.text = '100';
    });
    _showMessage('Payment verified and wallet credited.');
    await _refreshWalletData();
    await _refreshNotificationsCount();
  }

  void _handlePaymentError(CFErrorResponse response, String orderId) {
    _showMessage('Payment failed or cancelled. Please try again.', isError: true);
  }

  Future<void> _handleAddMoney() async {
    final amount = double.tryParse(_walletAmountController.text.trim());
    if (amount == null || amount <= 0) {
      _showMessage('Enter a valid amount to add.', isError: true);
      return;
    }
    if (amount < 25) {
      _showMessage('Minimum add money amount is ₹25.', isError: true);
      return;
    }

    setState(() => _isWalletBusy = true);
    final response = await ApiService.createWalletTopUp(amount);

    if (!mounted) {
      return;
    }

    setState(() => _isWalletBusy = false);

    if (!response.success) {
      _showMessage(response.message, isError: true);
      return;
    }

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : const <String, dynamic>{};
    final orderId = data['orderId']?.toString() ?? '';
    final paymentSessionId = data['paymentSessionId']?.toString() ?? '';
    final environmentLabel =
        (data['environment']?.toString() ?? 'PRODUCTION').toUpperCase();

    if (orderId.isEmpty || paymentSessionId.isEmpty) {
      _showMessage('Could not initialize Cashfree order.', isError: true);
      return;
    }

    setState(() => _pendingWalletOrderId = orderId);

    if (kIsWeb) {
      final paymentUrl = data['paymentUrl']?.toString() ?? '';
      if (paymentUrl.isEmpty) {
        _showMessage(
          'Cashfree web checkout link is unavailable for this order. Please use the app checkout flow.',
          isError: true,
        );
        return;
      }

      final uri = Uri.tryParse(paymentUrl);
      if (uri == null) {
        _showMessage('Invalid payment link returned by server.', isError: true);
        return;
      }

      final opened = await launchUrl(
        uri,
        mode: LaunchMode.platformDefault,
        webOnlyWindowName: '_blank',
      );

      if (!opened) {
        _showMessage('Could not open Cashfree payment page.', isError: true);
        return;
      }

      _showMessage('Payment page opened. Complete payment and tap Verify Payment.');
      return;
    }

    final cfEnvironment = environmentLabel == 'SANDBOX'
        ? CFEnvironment.SANDBOX
        : CFEnvironment.PRODUCTION;

    final options = CFSessionBuilder()
        .setEnvironment(cfEnvironment)
        .setOrderId(orderId)
        .setPaymentSessionId(paymentSessionId)
        .build();
        
    final cfTheme = CFThemeBuilder()
        .setPrimaryTextColor("#E63946")
        .setButtonBackgroundColor("#E63946")
        .build();
        
    final cfPaymentComponent = CFPaymentComponentBuilder()
        .setComponents([
          CFPaymentModes.CARD,
          CFPaymentModes.UPI,
          CFPaymentModes.NETBANKING,
          CFPaymentModes.WALLET,
          CFPaymentModes.PAYLATER,
          CFPaymentModes.EMI
        ])
        .build();

    final dropCheckoutPayment = CFDropCheckoutPaymentBuilder()
        .setSession(options)
        .setTheme(cfTheme)
        .setPaymentComponent(cfPaymentComponent)
        .build();

    try {
      _cfPaymentGatewayService.doPayment(dropCheckoutPayment);
    } catch (_) {
      _showMessage('Unable to open Cashfree checkout.', isError: true);
    }
  }

  Future<void> _handleVerifyPendingPayment() async {
    final orderId = _pendingWalletOrderId?.trim() ?? '';
    if (orderId.isEmpty) {
      _showMessage('No pending payment found to verify.', isError: true);
      return;
    }

    setState(() => _isWalletBusy = true);
    final response = await ApiService.verifyWalletTopUp({'orderId': orderId});

    if (!mounted) {
      return;
    }

    setState(() => _isWalletBusy = false);

    if (!response.success) {
      _showMessage(response.message, isError: true);
      return;
    }

    setState(() {
      _pendingWalletOrderId = null;
      _walletAmountController.text = '100';
    });
    _showMessage(response.message);
    await _refreshWalletData();
    await _refreshNotificationsCount();
  }

  Future<void> _openPaymentsScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PaymentsScreen()),
    );
    await _loadDashboard(showLoader: false);
  }

  Future<void> _openWithdrawalScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
    );
    await _loadDashboard(showLoader: false);
    await _refreshNotificationsCount();
  }

  Future<void> _openNotificationsScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
    await _refreshNotificationsCount();
  }

  Future<void> _openLeaderboardScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
    );
  }

  Future<void> _loadAppVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final version = info.version.trim();
      final buildNumber = info.buildNumber.trim();
      final label = buildNumber.isEmpty ? version : '$version+$buildNumber';

      if (!mounted) {
        return;
      }

      setState(() => _appVersionLabel = label);
    } catch (_) {
      // Keep profile usable if package info is unavailable.
    }
  }

  Future<void> _openSupportUrl(String url) async {
    final uri = Uri.parse(url);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      _showMessage(context.tx('Support channels could not be opened.'), isError: true);
    }
  }

  Future<void> _openLanguageSettings() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (sheetContext) {
        final tx = sheetContext.tx;
        final current = LanguageService.currentLanguageCode;

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx('Language'),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                RadioListTile<String>(
                  value: 'en',
                  groupValue: current,
                  title: Text(tx('English')),
                  onChanged: (value) => Navigator.pop(sheetContext, value),
                ),
                RadioListTile<String>(
                  value: 'hi',
                  groupValue: current,
                  title: Text(tx('Hindi')),
                  onChanged: (value) => Navigator.pop(sheetContext, value),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (selected == null || !mounted) {
      return;
    }

    await LanguageService.setLanguage(selected, syncCloud: true);
    if (!mounted) {
      return;
    }
    _showMessage(context.tx('Language updated'));
  }

  Future<void> _openCategory(String category) async {
    final label = _categoryLabel(context, category);
    final modes = _modes.where((m) => m.category == category).toList();
    await Navigator.push(
      context,
      _FadeRoute(
        child: CategoryModesScreen(
          category: category,
          categoryLabel: label,
          modes: modes,
        ),
      ),
    );
    await _loadDashboard(showLoader: false);
  }

  Future<void> _openTournament(TournamentSummary tournament) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TournamentDetailScreen(tournamentId: tournament.id),
      ),
    );

    await _loadDashboard(showLoader: false);
  }

  Future<void> _forceLogout({String? message}) async {
    await PushService.unregisterCurrentToken();
    await ApiService.logout();
    if (!mounted) {
      return;
    }

    if (message != null && message.isNotEmpty) {
      _showMessage(message, isError: true);
    }

    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.accentRed : AppColors.accentGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: ThreeDotsLoader()),
      );
    }

    final user = _user;
    if (user == null) {
      return const Scaffold(
        body: Center(child: ThreeDotsLoader()),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _buildModesTab(user),
            _buildMyMatchesTab(),
            _buildWalletTab(),
            _buildProfileTab(user),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.accentRed,
        unselectedItemColor: AppColors.textMuted,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.sports_esports_outlined),
            activeIcon: const Icon(Icons.sports_esports),
            label: tx('Modes'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.calendar_month_outlined),
            activeIcon: const Icon(Icons.calendar_month),
            label: tx('My Matches'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            activeIcon: const Icon(Icons.account_balance_wallet),
            label: tx('Wallet'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: tx('Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildModesTab(UserProfile user) {
    final tx = context.tx;

    return RefreshIndicator(
      onRefresh: _refreshModesData,
      color: AppColors.accentRed,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          _TopHeader(
            user: user,
            unreadCount: _unreadNotifications,
            onNotificationsTap: _openNotificationsScreen,
          ),
          const SizedBox(height: 20),
          _WalletHeroCard(
            balance: _walletBalance,
            onTap: () => setState(() => _currentIndex = 2),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFED7AA)),
            ),
            child: Text(
              tx('Disclaimer: For any payment issues, contact support immediately.'),
              style: const TextStyle(
                color: Color(0xFF9A3412),
                fontSize: 12,
                fontWeight: FontWeight.w700,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            tx('Modes'),
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Tap a category to browse all tournaments inside it.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _CategoryCard(
                  label: 'Battle\nRoyale',
                  icon: Icons.local_fire_department,
                  accentColor: const Color(0xFFE63946),
                  modeCount: _modes.where((m) => m.category == 'br').length,
                  onTap: () => _openCategory('br'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _CategoryCard(
                  label: 'Clash\nSquad',
                  icon: Icons.sports_mma,
                  accentColor: const Color(0xFF274C77),
                  modeCount: _modes.where((m) => m.category == 'cs').length,
                  onTap: () => _openCategory('cs'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _CategoryCard(
                  label: 'Lone\nWolf',
                  icon: Icons.bolt,
                  accentColor: const Color(0xFF6C47A0),
                  modeCount: _modes.where((m) => m.category == 'lw').length,
                  onTap: () => _openCategory('lw'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _CategoryCard(
                  label: 'Headshot\nOnly',
                  icon: Icons.gps_fixed,
                  accentColor: const Color(0xFF14532D),
                  modeCount: _modes.where((m) => m.category == 'hs').length,
                  onTap: () => _openCategory('hs'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildMyMatchesTab() {
    final tx = context.tx;

    return RefreshIndicator(
      onRefresh: _refreshMyMatches,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Text(
            tx('My Tournaments'),
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Track your upcoming matches, see slot assignments, and view room details when they unlock.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _StatusFilterChip(
                label: tx('Upcoming'),
                selected: _selectedMyStatus == 'upcoming',
                onTap: () => setState(() => _selectedMyStatus = 'upcoming'),
              ),
              const SizedBox(width: 8),
              _StatusFilterChip(
                label: tx('Active'),
                selected: _selectedMyStatus == 'active',
                onTap: () => setState(() => _selectedMyStatus = 'active'),
              ),
              const SizedBox(width: 8),
              _StatusFilterChip(
                label: tx('Completed'),
                selected: _selectedMyStatus == 'completed',
                onTap: () => setState(() => _selectedMyStatus = 'completed'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_filteredMyTournaments.isEmpty)
            _EmptyCard(
              title: tx('No matches in this state'),
              subtitle: tx('Join a tournament from the Modes tab and it will appear here.'),
            )
          else
            ..._filteredMyTournaments.map(
              (tournament) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: _MyTournamentCard(
                  tournament: tournament,
                  onTap: () => _openTournament(tournament),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWalletTab() {
    final tx = context.tx;

    return RefreshIndicator(
      onRefresh: _refreshWalletData,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Text(
            tx('Wallet'),
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Add money with Cashfree here. Use the separate Withdrawal Center for payout requests.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 20),
          _WalletHeroCard(balance: _walletBalance),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx('Wallet Actions'),
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Use Cashfree to top up instantly. Withdrawals are managed from the dedicated Withdrawal Center.',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 16),
                Text(
                  tx('Add Money'),
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _walletAmountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Add amount',
                    prefixIcon: Icon(Icons.currency_rupee),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Minimum add money amount: ₹25',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isWalletBusy ? null : _handleAddMoney,
                    child: _isWalletBusy
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              color: Colors.white,
                            ),
                          )
                        : Text(tx('Pay With Cashfree')),
                  ),
                ),
                if (_pendingWalletOrderId != null && _pendingWalletOrderId!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.bgSecondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Pending Order: $_pendingWalletOrderId',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _isWalletBusy ? null : _handleVerifyPendingPayment,
                      icon: const Icon(Icons.verified),
                      label: Text(tx('Verify Payment')),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                const Divider(height: 1),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _openWithdrawalScreen,
                    icon: const Icon(Icons.south_west_rounded),
                    label: Text(tx('Open Withdrawal Center')),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _openPaymentsScreen,
                    icon: const Icon(Icons.payments_outlined),
                    label: Text(tx('Open Payments History')),
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                  ),
                  child: const Text(
                    'Withdrawal flow: Request -> Approved -> Deposited. Wallet deduction happens only on Deposited.',
                    style: TextStyle(
                      color: Color(0xFF9A3412),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            tx('Recent Transactions'),
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          if (_transactions.isEmpty)
            _EmptyCard(
              title: tx('No wallet activity yet'),
              subtitle: tx('Credits, debits, entry fees, and match rewards will appear here.'),
            )
          else
            ..._transactions.map(
              (transaction) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TransactionCard(transaction: transaction),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProfileTab(UserProfile user) {
    final tx = context.tx;
    final completed = _myTournaments.where((item) => item.status == 'completed').length;
    final active = _myTournaments.where((item) => item.status == 'active').length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        CircleAvatar(
          radius: 42,
          backgroundColor: AppColors.accentRed.withValues(alpha: 0.12),
          foregroundColor: AppColors.accentRed,
          child: Text(
            user.fullName.isEmpty ? 'T' : user.fullName[0].toUpperCase(),
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
          ),
        ),
        const SizedBox(height: 14),
        Center(
          child: Text(
            user.fullName,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Center(
          child: Text(
            '@${user.username}',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
        const SizedBox(height: 4),
        Center(
          child: Text(
            user.email,
            style: const TextStyle(color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ProfileStat(label: tx('My Matches'), value: _myTournaments.length.toString()),
              _ProfileStat(label: tx('Active'), value: active.toString()),
              _ProfileStat(label: tx('Completed'), value: completed.toString()),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _ProfileActionTile(
          icon: Icons.calendar_month_outlined,
          title: tx('My Upcoming Matches'),
          onTap: () => setState(() {
            _selectedMyStatus = 'upcoming';
            _currentIndex = 1;
          }),
        ),
        _ProfileActionTile(
          icon: Icons.account_balance_wallet_outlined,
          title: tx('Wallet History'),
          onTap: () => setState(() => _currentIndex = 2),
        ),
        _ProfileActionTile(
          icon: Icons.language,
          title: tx('Language'),
          onTap: _openLanguageSettings,
        ),
        _ProfileActionTile(
          icon: Icons.payments_outlined,
          title: tx('Payments & Withdrawals'),
          onTap: _openPaymentsScreen,
        ),
        _ProfileActionTile(
          icon: Icons.notifications_active_outlined,
          title: tx('Notifications'),
          onTap: _openNotificationsScreen,
        ),
        _ProfileActionTile(
          icon: Icons.emoji_events_outlined,
          title: tx('Leaderboard'),
          onTap: _openLeaderboardScreen,
        ),
        _ProfileActionTile(
          icon: Icons.sports_esports_outlined,
          title: tx('Browse Modes'),
          onTap: () => setState(() => _currentIndex = 0),
        ),
        if (_appVersionLabel.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppColors.accentBlue),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'App Version: $_appVersionLabel',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 4),
        _SupportContactCard(
          onOpenWhatsApp: () => _openSupportUrl('https://wa.me/917878368325'),
          onOpenInstagram: () => _openSupportUrl('https://instagram.com/totalfire.in'),
          onOpenTelegram: () => _openSupportUrl('https://t.me/total_fire'),
        ),
        const SizedBox(height: 18),
        OutlinedButton.icon(
          onPressed: _forceLogout,
          icon: const Icon(Icons.logout_rounded),
          label: Text(tx('Logout')),
        ),
      ],
    );
  }
}

class _TopHeader extends StatelessWidget {
  const _TopHeader({
    required this.user,
    required this.unreadCount,
    required this.onNotificationsTap,
  });

  final UserProfile user;
  final int unreadCount;
  final VoidCallback onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    final firstName = user.fullName.trim().split(' ').first;

    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.asset(
            'assets/images/totalfire-logo.jpeg',
            width: 46,
            height: 46,
            fit: BoxFit.cover,
            errorBuilder: (ctx, err, _) => Image.asset(
              'assets/images/totalfire-logo.webp',
              width: 46,
              height: 46,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tx('Total Fire'),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  foreground: Paint()
                    ..shader = const LinearGradient(
                      colors: [AppColors.accentRed, AppColors.accentOrange],
                    ).createShader(const Rect.fromLTWH(0, 0, 180, 32)),
                ),
              ),
              Text(
                '${context.tx('Welcome back')}, $firstName',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: onNotificationsTap,
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.notifications_none_rounded),
              if (unreadCount > 0)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    width: 16,
                    height: 16,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: AppColors.accentRed,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _WalletHeroCard extends StatelessWidget {
  const _WalletHeroCard({
    required this.balance,
    this.onTap,
  });

  final double balance;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.accentBlue, Color(0xFF2A4A7F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.accentBlue.withValues(alpha: 0.28),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tx('Wallet Balance'),
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Text(
                  _currency(balance),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (onTap != null) ...[
                  const SizedBox(height: 14),
                  TextButton(
                    onPressed: onTap,
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.14),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: Text(context.tx('Wallet')),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.account_balance_wallet_rounded,
              size: 36,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.label,
    required this.icon,
    required this.accentColor,
    required this.modeCount,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color accentColor;
  final int modeCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: accentColor.withValues(alpha: 0.25),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: AspectRatio(
            aspectRatio: 0.62, // passport portrait ratio
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.asset(
                  'assets/images/main-image-for-all-modes.jpeg',
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, _) => Container(color: accentColor),
                ),
                // dark gradient overlay
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.08),
                        Colors.black.withValues(alpha: 0.78),
                      ],
                    ),
                  ),
                ),
                // mode count badge top-right
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.88),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      modeCount > 0 ? '$modeCount' : '—',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ),
                // label + arrow at bottom
                Positioned(
                  bottom: 12,
                  left: 10,
                  right: 10,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon, color: Colors.white, size: 20),
                      const SizedBox(height: 6),
                      Text(
                        label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FadeRoute extends PageRoute<void> {
  _FadeRoute({required this.child});

  final Widget child;

  @override
  Color? get barrierColor => null;

  @override
  String? get barrierLabel => null;

  @override
  bool get maintainState => true;

  @override
  Duration get transitionDuration => const Duration(milliseconds: 260);

  @override
  Widget buildPage(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation) {
    return FadeTransition(opacity: animation, child: child);
  }
}

class _MyTournamentCard extends StatelessWidget {
  const _MyTournamentCard({
    required this.tournament,
    required this.onTap,
  });

  final TournamentSummary tournament;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final roomVisible = tournament.roomId != null && tournament.roomId!.isNotEmpty;

    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    tournament.matchId,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
                _InlineStatusPill(status: tournament.status),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              tournament.title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              formatDateTimeWithCountdown(tournament.startTime),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (tournament.seatsBooked > 1)
                  _MiniPill(label: 'Seats ${tournament.slotNumbers ?? tournament.seatsBooked}'),
                if (tournament.seatsBooked <= 1)
                  _MiniPill(label: 'Slot ${tournament.slotNumber ?? '-'}'),
                _MiniPill(
                  label: tournament.teamNumber == null
                      ? 'Solo'
                      : 'Team ${tournament.teamNumber}',
                ),
                _MiniPill(label: '${tournament.currentPlayers}/${tournament.maxPlayers} joined'),
              ],
            ),
            const SizedBox(height: 10),
            if (tournament.status == 'completed')
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.accentGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Match completed — tap to view results',
                      style: TextStyle(
                        color: AppColors.accentGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Icon(Icons.emoji_events, color: AppColors.accentGreen, size: 18),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: roomVisible
                      ? const Color(0xFFFFF7ED)
                      : AppColors.bgSecondary,
                  borderRadius: BorderRadius.circular(14),
                  border: roomVisible
                      ? Border.all(color: const Color(0xFFFED7AA))
                      : null,
                ),
                child: Text(
                  roomVisible
                      ? 'Room ${tournament.roomId} • Pass ${tournament.roomPassword ?? '-'}\nDo not share room details. Sharing can get your account banned or blocked from using the app.'
                      : 'Room unlocks only for joined players from 5 minutes before start until 5 minutes after start',
                  style: TextStyle(
                    color: roomVisible ? const Color(0xFF9A3412) : AppColors.textSecondary,
                    fontWeight: FontWeight.w700,
                    height: roomVisible ? 1.35 : 1.2,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  const _TransactionCard({required this.transaction});

  final WalletTransactionItem transaction;

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.type == 'credit';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: (isCredit ? AppColors.accentGreen : AppColors.accentRed)
                .withValues(alpha: 0.12),
            foregroundColor: isCredit ? AppColors.accentGreen : AppColors.accentRed,
            child: Icon(isCredit ? Icons.south_west : Icons.north_east),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatDateTime(transaction.createdAt),
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                if (transaction.referenceId != null)
                  Text(
                    'Ref: ${transaction.referenceId}',
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : '-'}${_currency(transaction.amount)}',
            style: TextStyle(
              color: isCredit ? AppColors.accentGreen : AppColors.accentRed,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted),
        ),
      ],
    );
  }
}

class _ProfileActionTile extends StatelessWidget {
  const _ProfileActionTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: ListTile(
          onTap: onTap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          leading: Icon(icon, color: AppColors.accentBlue),
          title: Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          trailing: const Icon(Icons.chevron_right_rounded),
        ),
      ),
    );
  }
}

class _SupportContactCard extends StatelessWidget {
  const _SupportContactCard({
    required this.onOpenWhatsApp,
    required this.onOpenInstagram,
    required this.onOpenTelegram,
  });

  final VoidCallback onOpenWhatsApp;
  final VoidCallback onOpenInstagram;
  final VoidCallback onOpenTelegram;

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF3E8), Color(0xFFFFE9DC)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFDBA74)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.support_agent, color: Color(0xFFC2410C)),
              const SizedBox(width: 8),
              Text(
                tx('Contact Support'),
                style: const TextStyle(
                  color: Color(0xFF9A3412),
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            tx('Need help with payments, rooms, slots, or account issues? Reach us directly:'),
            style: const TextStyle(
              color: Color(0xFF9A3412),
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            tx('WhatsApp: 7878368325'),
            style: const TextStyle(
              color: Color(0xFF14532D),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            tx('Instagram: @totalfire.in'),
            style: const TextStyle(
              color: Color(0xFFBE185D),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            tx('Telegram: @total_fire'),
            style: const TextStyle(
              color: Color(0xFF1E40AF),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onOpenWhatsApp,
                  icon: const Icon(Icons.chat),
                  label: Text(tx('Open WhatsApp')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onOpenInstagram,
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: Text(tx('Open Instagram')),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFBE185D),
                    side: const BorderSide(color: Color(0xFFF9A8D4)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onOpenTelegram,
                  icon: const Icon(Icons.send_rounded),
                  label: Text(tx('Open Telegram')),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1D4ED8),
                    side: const BorderSide(color: Color(0xFF93C5FD)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusFilterChip extends StatelessWidget {
  const _StatusFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.accentBlue : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.bgSecondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _InlineStatusPill extends StatelessWidget {
  const _InlineStatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'completed':
        color = AppColors.accentGreen;
        break;
      case 'active':
        color = AppColors.accentOrange;
        break;
      case 'cancelled':
        color = AppColors.accentRed;
        break;
      default:
        color = AppColors.accentBlue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.inbox_outlined,
            size: 34,
            color: AppColors.textMuted,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
        ],
      ),
    );
  }
}

String _currency(double value) {
  if (value % 1 == 0) {
    return '₹${value.toStringAsFixed(0)}';
  }
  return '₹${value.toStringAsFixed(2)}';
}

String _categoryLabel(BuildContext context, String category) {
  final tx = context.tx;

  switch (category) {
    case 'br':
      return tx('Battle Royale');
    case 'cs':
      return tx('Clash Squad');
    case 'lw':
      return tx('Lone Wolf');
    case 'hs':
      return tx('Headshot');
    default:
      return tx('Mode');
  }
}

