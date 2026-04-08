import 'package:flutter/material.dart';
import '../l10n/app_localization.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';
import '../widgets/three_dots_loader.dart';

class WithdrawalScreen extends StatefulWidget {
  const WithdrawalScreen({super.key});

  @override
  State<WithdrawalScreen> createState() => _WithdrawalScreenState();
}

class _WithdrawalScreenState extends State<WithdrawalScreen> {
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _upiController = TextEditingController();

  bool _isLoading = true;
  bool _isSubmitting = false;
  double _walletBalance = 0;
  List<WithdrawalRequestItem> _withdrawals = const [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final balance = await ApiService.getWalletBalance();
      final withdrawals = await ApiService.getWithdrawalRequests();

      if (!mounted) {
        return;
      }

      setState(() {
        _walletBalance = balance;
        _withdrawals = withdrawals;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString()),
          backgroundColor: AppColors.accentRed,
        ),
      );
    }
  }

  Future<void> _submitWithdrawal() async {
    final amount = double.tryParse(_amountController.text.trim());
    final upiId = _upiController.text.trim();

    if (amount == null || amount <= 0) {
      _showMessage('Enter a valid withdrawal amount.', isError: true);
      return;
    }

    final upiPattern = RegExp(r'^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$');
    if (!upiPattern.hasMatch(upiId)) {
      _showMessage('Enter a valid UPI ID (example: yourname@upi).', isError: true);
      return;
    }

    setState(() => _isSubmitting = true);
    final response = await ApiService.requestWithdrawal(amount, upiId);

    if (!mounted) {
      return;
    }

    setState(() => _isSubmitting = false);

    if (!response.success) {
      _showMessage(response.message, isError: true);
      return;
    }

    _amountController.clear();
    _showMessage(response.message);
    await _loadData();
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

    return Scaffold(
      appBar: AppBar(
        title: Text(tx('Withdrawal Center')),
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
                children: [
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.accentBlue, Color(0xFF2B4B80)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tx('Current Wallet Balance'),
                          style: const TextStyle(color: Colors.white70),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _currency(_walletBalance),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tx('Request Withdrawal'),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _amountController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Withdraw amount',
                            prefixIcon: Icon(Icons.currency_rupee),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _upiController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'UPI ID',
                            hintText: 'example@upi',
                            prefixIcon: Icon(Icons.account_balance_wallet_outlined),
                          ),
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
                          child: const Text(
                            'UPI ID is required for every withdrawal request. Please double-check before submitting.',
                            style: TextStyle(
                              color: Color(0xFF9A3412),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _isSubmitting ? null : _submitWithdrawal,
                            icon: const Icon(Icons.south_west_rounded),
                            label: _isSubmitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(tx('Submit Withdrawal')),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    tx('Withdrawal History'),
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_withdrawals.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        tx('No withdrawal requests yet'),
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  else
                    ..._withdrawals.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _WithdrawalRequestCard(item: item),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class _WithdrawalRequestCard extends StatelessWidget {
  const _WithdrawalRequestCard({required this.item});

  final WithdrawalRequestItem item;

  @override
  Widget build(BuildContext context) {
    final statusStyle = _statusStyle(item.status);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Request #${item.id}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: statusStyle.background,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  item.status.toUpperCase(),
                  style: TextStyle(color: statusStyle.foreground, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Amount: ${_currency(item.amount)}',
            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          if ((item.upiId ?? '').isNotEmpty)
            Text(
              'UPI: ${item.upiId}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          if ((item.method ?? '').isNotEmpty)
            Text(
              'Method: ${item.method}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          if ((item.accountDetails ?? '').isNotEmpty)
            Text(
              'Details: ${item.accountDetails}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          Text(
            'Requested: ${formatDateTime(item.createdAt)}',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
          if (item.processedAt != null)
            Text(
              'Processed: ${formatDateTime(item.processedAt!)}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          if ((item.adminNote ?? '').isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Admin note: ${item.adminNote}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatusStyle {
  const _StatusStyle({required this.foreground, required this.background});

  final Color foreground;
  final Color background;
}

_StatusStyle _statusStyle(String status) {
  switch (status) {
    case 'approved':
      return const _StatusStyle(
        foreground: Color(0xFF166534),
        background: Color(0xFFDCFCE7),
      );
    case 'rejected':
      return const _StatusStyle(
        foreground: Color(0xFF991B1B),
        background: Color(0xFFFEE2E2),
      );
    case 'deposited':
      return const _StatusStyle(
        foreground: Color(0xFF1D4ED8),
        background: Color(0xFFDBEAFE),
      );
    default:
      return const _StatusStyle(
        foreground: Color(0xFF9A3412),
        background: Color(0xFFFFEDD5),
      );
  }
}

String _currency(double value) {
  if (value % 1 == 0) {
    return '₹${value.toStringAsFixed(0)}';
  }
  return '₹${value.toStringAsFixed(2)}';
}
