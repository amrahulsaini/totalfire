import 'package:flutter/material.dart';
import '../l10n/app_localization.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/three_dots_loader.dart';

String _currency(double value) =>
    '₹${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 2)}';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardEntryItem> _leaders = const [];
  bool _isLoading = true;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _loadLeaderboard();
  }

  Future<void> _loadLeaderboard() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _loadError = null;
      });
    }

    try {
      final leaders = await ApiService.getLeaderboard(limit: 200);
      if (!mounted) {
        return;
      }

      setState(() {
        _leaders = leaders;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loadError = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Scaffold(
      appBar: AppBar(
        title: Text(tx('Leaderboard')),
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : RefreshIndicator(
              onRefresh: _loadLeaderboard,
              color: AppColors.accentRed,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  _LeaderboardHero(leaders: _leaders),
                  const SizedBox(height: 16),
                  if (_loadError != null && _leaders.isEmpty)
                    _InfoCard(
                      title: tx('Could not load leaderboard'),
                      subtitle: _loadError!,
                    )
                  else if (_leaders.isEmpty)
                    _InfoCard(
                      title: tx('No leaderboard data yet'),
                      subtitle: tx('Play tournaments to appear in rankings.'),
                    )
                  else
                    ..._leaders.map(
                      (leader) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _LeaderboardRow(entry: leader),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class _LeaderboardHero extends StatelessWidget {
  const _LeaderboardHero({required this.leaders});

  final List<LeaderboardEntryItem> leaders;

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;
    final top = leaders.isEmpty ? null : leaders.first;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1D3557), Color(0xFF274C77)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1D3557).withValues(alpha: 0.28),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events, color: Color(0xFFFFD166), size: 24),
              const SizedBox(width: 8),
              Text(
                tx('Top Earners Leaderboard'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (top == null)
            Text(
              tx('No rankings yet. Your first match result can put you on top.'),
              style: const TextStyle(color: Colors.white70, height: 1.45),
            )
          else
            Text(
              '#1 @${top.username} • ${_currency(top.totalEarnings)} • ${top.totalKills} kills',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          const SizedBox(height: 8),
          Text(
            tx('Ranks are sorted by total earnings in decreasing order.'),
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  const _LeaderboardRow({required this.entry});

  final LeaderboardEntryItem entry;

  Color _rankColor(int rank) {
    if (rank == 1) return const Color(0xFFD4A017);
    if (rank == 2) return const Color(0xFF64748B);
    if (rank == 3) return const Color(0xFFB45309);
    return AppColors.accentBlue;
  }

  @override
  Widget build(BuildContext context) {
    final gameName = entry.gameName.trim().isEmpty ? '-' : entry.gameName;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: _rankColor(entry.rank).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '#${entry.rank}',
              style: TextStyle(
                color: _rankColor(entry.rank),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '@${entry.username}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Game Name: $gameName',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Total Kills: ${entry.totalKills}',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            _currency(entry.totalEarnings),
            style: const TextStyle(
              color: AppColors.accentGreen,
              fontWeight: FontWeight.w900,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
