import 'package:flutter/material.dart';
import '../l10n/app_localization.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';
import '../widgets/three_dots_loader.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  bool _isLoading = true;
  double _walletBalance = 0;
  List<WalletTransactionItem> _transactions = const [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final balance = await ApiService.getWalletBalance();
      final transactions = await ApiService.getWalletTransactions();

      if (!mounted) {
        return;
      }

      setState(() {
        _walletBalance = balance;
        _transactions = transactions;
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

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Scaffold(
      appBar: AppBar(
        title: Text(tx('Payments History')),
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.fromLTRB(16, 14, 16, 12),
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
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadData,
                    child: _transactions.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(18),
                            children: [
                              const SizedBox(height: 40),
                              _EmptyState(
                                title: tx('No transactions yet'),
                                subtitle: tx('Top-ups, entry fees, rewards, and withdrawals will appear here.'),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _transactions.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) =>
                                _PaymentTransactionCard(item: _transactions[index]),
                          ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _PaymentTransactionCard extends StatelessWidget {
  const _PaymentTransactionCard({required this.item});

  final WalletTransactionItem item;

  @override
  Widget build(BuildContext context) {
    final isCredit = item.type == 'credit';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: (isCredit ? AppColors.accentGreen : AppColors.accentRed)
                .withValues(alpha: 0.14),
            foregroundColor: isCredit ? AppColors.accentGreen : AppColors.accentRed,
            child: Icon(isCredit ? Icons.south_west : Icons.north_east),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  formatDateTime(item.createdAt),
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                if ((item.referenceId ?? '').isNotEmpty)
                  Text(
                    'Ref: ${item.referenceId}',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : '-'}${_currency(item.amount)}',
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

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox_outlined, color: AppColors.textMuted, size: 36),
          const SizedBox(height: 10),
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
            style: const TextStyle(color: AppColors.textSecondary, height: 1.4),
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
