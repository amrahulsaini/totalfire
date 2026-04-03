import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';

class TournamentDetailScreen extends StatefulWidget {
  const TournamentDetailScreen({
    super.key,
    required this.tournamentId,
  });

  final int tournamentId;

  @override
  State<TournamentDetailScreen> createState() => _TournamentDetailScreenState();
}

class _TournamentDetailScreenState extends State<TournamentDetailScreen> {
  TournamentDetail? _detail;
  bool _isLoading = true;
  bool _isJoining = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    if (mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final detail = await ApiService.getTournamentDetail(widget.tournamentId);
      if (!mounted) {
        return;
      }

      setState(() => _detail = detail);
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString()),
          backgroundColor: AppColors.accentRed,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleJoin() async {
    final detail = _detail;
    if (detail == null) {
      return;
    }

    setState(() => _isJoining = true);
    final response = await ApiService.joinTournament(detail.tournament.id);
    if (!mounted) {
      return;
    }

    setState(() => _isJoining = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(response.message),
        backgroundColor: response.success ? AppColors.accentGreen : AppColors.accentRed,
      ),
    );

    if (response.success) {
      await _loadDetail();
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = _detail;

    return Scaffold(
      appBar: AppBar(title: const Text('Match Details')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : detail == null
              ? const Center(child: Text('Tournament unavailable'))
              : RefreshIndicator(
                  onRefresh: _loadDetail,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      _SummaryCard(tournament: detail.tournament),
                      const SizedBox(height: 16),
                      if (detail.userEntry != null) ...[
                        _SectionCard(
                          title: 'Your Slot',
                          child: Row(
                            children: [
                              _SlotBadge(label: 'Slot #${detail.userEntry!.slotNumber}'),
                              const SizedBox(width: 10),
                              _SlotBadge(
                                label: detail.userEntry!.teamNumber == null
                                    ? 'Solo'
                                    : 'Team ${detail.userEntry!.teamNumber}',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      _SectionCard(
                        title: 'Room Access',
                        child: detail.tournament.roomId == null
                            ? const Text(
                                'Room ID and password unlock 5 minutes before match start.',
                                style: TextStyle(color: AppColors.textSecondary, height: 1.6),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _RoomLine(
                                    label: 'Room ID',
                                    value: detail.tournament.roomId ?? '-',
                                  ),
                                  const SizedBox(height: 10),
                                  _RoomLine(
                                    label: 'Password',
                                    value: detail.tournament.roomPassword ?? '-',
                                  ),
                                ],
                              ),
                      ),
                      const SizedBox(height: 16),
                      if (detail.tournament.status == 'upcoming' && detail.userEntry == null) ...[
                        SizedBox(
                          height: 54,
                          child: ElevatedButton(
                            onPressed: detail.tournament.isFull || _isJoining ? null : _handleJoin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: detail.tournament.isFull
                                  ? AppColors.textMuted
                                  : AppColors.accentRed,
                            ),
                            child: _isJoining
                                ? const SizedBox(
                                    height: 22,
                                    width: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    detail.tournament.isFull
                                        ? 'Join Another Match'
                                        : 'Join With Wallet Balance',
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      _SectionCard(
                        title: 'Joined Players',
                        child: detail.entries.isEmpty
                            ? const Text(
                                'No players have joined this match yet.',
                                style: TextStyle(color: AppColors.textSecondary),
                              )
                            : Column(
                                children: detail.entries
                                    .map(
                                      (entry) => Padding(
                                        padding: const EdgeInsets.only(bottom: 10),
                                        child: _EntryRow(entry: entry),
                                      ),
                                    )
                                    .toList(),
                              ),
                      ),
                      if (detail.results.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        _SectionCard(
                          title: 'Results & Rewards',
                          child: Column(
                            children: detail.results
                                .map(
                                  (result) => Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: _ResultRow(result: result),
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.tournament});

  final TournamentSummary tournament;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  tournament.matchId,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _StatusPill(status: tournament.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            tournament.title,
            style: const TextStyle(color: Colors.white70, fontSize: 15),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _MetricPill(label: formatDateTimeWithCountdown(tournament.startTime), icon: Icons.schedule),
              _MetricPill(
                label: '${tournament.currentPlayers}/${tournament.maxPlayers} joined',
                icon: Icons.people_outline,
              ),
              _MetricPill(
                label: 'Entry ${_currency(tournament.entryFee)}',
                icon: Icons.currency_rupee,
              ),
              _MetricPill(
                label: tournament.winPrize ?? '${_currency(tournament.perKill)}/Kill',
                icon: Icons.emoji_events_outlined,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
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
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _RoomLine extends StatelessWidget {
  const _RoomLine({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgSecondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _EntryRow extends StatelessWidget {
  const _EntryRow({required this.entry});

  final TournamentEntry entry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.accentRed.withValues(alpha: 0.12),
            foregroundColor: AppColors.accentRed,
            child: Text(entry.slotNumber.toString()),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.fullName,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '@${entry.username} • ${entry.teamNumber == null ? 'Solo' : 'Team ${entry.teamNumber}'}',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  const _ResultRow({required this.result});

  final MatchResultItem result;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: result.isWinner
            ? AppColors.accentGreen.withValues(alpha: 0.08)
            : AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.fullName,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '@${result.username} • ${result.kills} kills',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _currency(result.rewardAmount),
                style: TextStyle(
                  color: result.isWinner ? AppColors.accentGreen : AppColors.textPrimary,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (result.isWinner)
                const Text(
                  'Winner',
                  style: TextStyle(
                    color: AppColors.accentGreen,
                    fontWeight: FontWeight.w800,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'completed' => AppColors.accentGreen,
      'active' => AppColors.accentOrange,
      'cancelled' => AppColors.accentRed,
      _ => Colors.white,
    };

    final background = switch (status) {
      'completed' => AppColors.accentGreen.withValues(alpha: 0.14),
      'active' => AppColors.accentOrange.withValues(alpha: 0.18),
      'cancelled' => AppColors.accentRed.withValues(alpha: 0.18),
      _ => Colors.white.withValues(alpha: 0.18),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.icon,
  });

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotBadge extends StatelessWidget {
  const _SlotBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.bgSecondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w800,
        ),
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

