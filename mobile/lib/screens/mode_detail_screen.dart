import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';
import '../widgets/three_dots_loader.dart';
import 'tournament_detail_screen.dart';

class ModeDetailScreen extends StatefulWidget {
  const ModeDetailScreen({
    super.key,
    required this.modeSlug,
  });

  final String modeSlug;

  @override
  State<ModeDetailScreen> createState() => _ModeDetailScreenState();
}

class _ModeDetailScreenState extends State<ModeDetailScreen> {
  ModeCatalogItem? _mode;
  List<TournamentSummary> _tournaments = const [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMode();
  }

  Future<void> _loadMode() async {
    if (mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final mode = await ApiService.getMode(widget.modeSlug);
      final tournaments = await ApiService.getTournaments(
        modeSlug: widget.modeSlug,
        status: 'upcoming',
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _mode = mode;
        _tournaments = tournaments;
      });
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

  Future<void> _openTournament(TournamentSummary tournament) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TournamentDetailScreen(tournamentId: tournament.id),
      ),
    );

    await _loadMode();
  }

  @override
  Widget build(BuildContext context) {
    final mode = _mode;

    return Scaffold(
      appBar: AppBar(
        title: Text(mode?.title ?? 'Mode Details'),
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : mode == null
              ? const Center(child: Text('Mode details unavailable'))
              : RefreshIndicator(
                  onRefresh: _loadMode,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      _HeroImage(title: mode.title),
                      const SizedBox(height: 20),
                      _SectionCard(
                        title: 'Overview',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _InfoPill(icon: Icons.people_alt_outlined, label: mode.players),
                                _InfoPill(
                                  icon: Icons.currency_rupee,
                                  label: 'Entry ${_currency(mode.entryFee)}',
                                ),
                                _InfoPill(
                                  icon: Icons.emoji_events_outlined,
                                  label: mode.winPrize ?? '${_currency(mode.perKill ?? 0)}/Kill',
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              mode.fullDescription,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                height: 1.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      _SectionCard(
                        title: 'Rules',
                        child: Column(
                          children: mode.rules
                              .map(
                                (rule) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Padding(
                                        padding: EdgeInsets.only(top: 3),
                                        child: Icon(
                                          Icons.check_circle,
                                          size: 18,
                                          color: AppColors.accentGreen,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          rule,
                                          style: const TextStyle(
                                            color: AppColors.textSecondary,
                                            height: 1.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _SectionCard(
                        title: 'Reward Breakdown',
                        child: Column(
                          children: mode.rewardBreakdown
                              .map(
                                (item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        item.label,
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        item.value,
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _SectionCard(
                        title: 'Upcoming Matches',
                        child: _tournaments.isEmpty
                            ? const Text(
                                'No upcoming match has been created for this mode yet. Ask admin to open a tournament slot.',
                                style: TextStyle(color: AppColors.textSecondary, height: 1.6),
                              )
                            : Column(
                                children: _tournaments
                                    .map(
                                      (tournament) => Padding(
                                        padding: const EdgeInsets.only(bottom: 12),
                                        child: _TournamentPreviewCard(
                                          tournament: tournament,
                                          onOpen: () => _openTournament(tournament),
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: double.infinity,
        color: const Color(0xFF0D0D1A),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Image.asset(
              'assets/images/main-image-for-all-modes.jpeg',
              width: double.infinity,
              fit: BoxFit.contain,
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
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

class _InfoPill extends StatelessWidget {
  const _InfoPill({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.bgSecondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.accentRed),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _TournamentPreviewCard extends StatelessWidget {
  const _TournamentPreviewCard({
    required this.tournament,
    required this.onOpen,
  });

  final TournamentSummary tournament;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(18),
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: tournament.isFull
                      ? AppColors.accentRed.withValues(alpha: 0.12)
                      : AppColors.accentGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Text(
                  tournament.isFull ? 'Full' : 'Open',
                  style: TextStyle(
                    color: tournament.isFull ? AppColors.accentRed : AppColors.accentGreen,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            tournament.title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${formatDateTimeWithCountdown(tournament.startTime)} • ${tournament.currentPlayers}/${tournament.maxPlayers} joined',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onOpen,
              child: const Text('Open Match'),
            ),
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

