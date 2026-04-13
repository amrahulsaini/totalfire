import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../l10n/app_localization.dart';
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
  final Set<int> _selectedSlots = <int>{};
  Timer? _autoRefreshTimer;
  String? _currentUsername;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
    _loadDetail();
    // Auto-refresh every 30 s so room credentials appear automatically
    // within 5 minutes of match start (backend gates the reveal).
    _autoRefreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadDetail(),
    );
  }

  Future<void> _loadCurrentUser() async {
    final profile = await ApiService.getSavedUserProfile();
    if (mounted && profile != null) {
      setState(() => _currentUsername = profile.username);
    }
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
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

      final takenSlots = detail.entries.map((entry) => entry.slotNumber).toSet();
      final myBookedSlots = detail.userEntries.map((entry) => entry.slotNumber).toSet();

      setState(() {
        _detail = detail;
        _selectedSlots.removeWhere(
          (slot) => takenSlots.contains(slot) || myBookedSlots.contains(slot),
        );
        if (detail.userEntries.isNotEmpty) {
          _selectedSlots.clear();
        }
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

  int _seatSelectionLimit(TournamentSummary tournament) {
    return tournament.teamSize > 1 ? tournament.teamSize : 1;
  }

  void _toggleSelectedSlot(int slot) {
    final detail = _detail;
    if (detail == null) return;

    final limit = _seatSelectionLimit(detail.tournament);
    var exceededLimit = false;

    setState(() {
      if (_selectedSlots.contains(slot)) {
        _selectedSlots.remove(slot);
        return;
      }

      if (_selectedSlots.length >= limit) {
        exceededLimit = true;
        return;
      }

      _selectedSlots.add(slot);
    });

    if (exceededLimit) {
      _showMessage(
        'You can select up to $limit seats in this mode.',
        isError: true,
      );
    }
  }

  Future<void> _copyCredential(String label, String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;

    await Clipboard.setData(ClipboardData(text: trimmed));
    if (!mounted) return;
    _showMessage('$label copied');
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.accentRed : AppColors.accentGreen,
      ),
    );
  }

  Future<void> _handleJoin() async {
    final detail = _detail;
    if (detail == null) return;
    if (_selectedSlots.isEmpty) {
      _showMessage('Select at least one seat to join.', isError: true);
      return;
    }

    final selectedSlots = _selectedSlots.toList()..sort();
    final seatCount = selectedSlots.length;

    // Fetch wallet balance so we can show it in the confirm dialog.
    double walletBalance = 0;
    try {
      walletBalance = await ApiService.getWalletBalance();
    } catch (_) {}
    if (!mounted) return;

    // Step 1: collect in-game name + show fee confirmation dialog.
    final gameName = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _GameNameDialog(
        entryFee: detail.tournament.entryFee,
        walletBalance: walletBalance,
        seatCount: seatCount,
      ),
    );

    if (!mounted || gameName == null || gameName.isEmpty) return;

    // Step 2: join tournament
    setState(() => _isJoining = true);
    final response = await ApiService.joinTournament(
      detail.tournament.id,
      gameName: gameName,
      preferredSlots: selectedSlots,
    );
    if (!mounted) return;

    setState(() => _isJoining = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(response.message),
        backgroundColor: response.success ? AppColors.accentGreen : AppColors.accentRed,
      ),
    );

    if (response.success) {
      setState(() => _selectedSlots.clear());
      await _loadDetail();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;
    final detail = _detail;

    return Scaffold(
      appBar: AppBar(title: Text(tx('Match Details'))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : detail == null
              ? Center(child: Text(tx('Tournament unavailable')))
              : RefreshIndicator(
                  onRefresh: _loadDetail,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      _SummaryCard(tournament: detail.tournament),
                      const SizedBox(height: 16),
                      if (detail.userEntries.isNotEmpty) ...[
                        _SectionCard(
                          title: detail.userEntries.length > 1 ? 'Your Seats' : tx('Your Slot'),
                          child: Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: detail.userEntries
                                .map(
                                  (entry) => _SlotBadge(
                                    label: entry.teamNumber == null
                                        ? 'Slot #${entry.slotNumber} • Solo'
                                        : 'Slot #${entry.slotNumber} • Team ${entry.teamNumber}',
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      _SectionCard(
                        title: tx('Room Access'),
                        action: IconButton(
                          icon: const Icon(Icons.refresh, size: 20),
                          color: AppColors.textSecondary,
                          tooltip: tx('Refresh'),
                          onPressed: _loadDetail,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        child: detail.tournament.roomId == null
                            ? Text(
                              'Room ID and password are visible only to joined players from 5 minutes before start until 5 minutes after start.',
                              style: const TextStyle(color: AppColors.textSecondary, height: 1.6),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFF7ED),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFFED7AA)),
                                    ),
                                    child: const Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Icon(Icons.warning_amber_rounded, color: Color(0xFF9A3412), size: 18),
                                        SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            'Warning: Room ID and password are private. Do not share these details publicly. If shared, your account may be banned or blocked from using the app.',
                                            style: TextStyle(
                                              color: Color(0xFF9A3412),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              height: 1.4,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  _RoomLine(
                                    label: tx('Room ID'),
                                    value: detail.tournament.roomId ?? '-',
                                    onCopy: () => _copyCredential('Room ID', detail.tournament.roomId ?? ''),
                                  ),
                                  const SizedBox(height: 10),
                                  _RoomLine(
                                    label: 'Password',
                                    value: detail.tournament.roomPassword ?? '-',
                                    onCopy: () => _copyCredential('Password', detail.tournament.roomPassword ?? ''),
                                  ),
                                ],
                              ),
                      ),
                      const SizedBox(height: 16),
                      _SeatPicker(
                        tournament: detail.tournament,
                        entries: detail.entries,
                        userSlots: detail.userEntries.map((entry) => entry.slotNumber).toSet(),
                        selectedSlots: _selectedSlots,
                        maxSelectableSeats: _seatSelectionLimit(detail.tournament),
                        onSlotSelected: detail.userEntries.isEmpty && detail.tournament.status == 'upcoming'
                            ? _toggleSelectedSlot
                            : null,
                      ),
                      const SizedBox(height: 16),
                      if (detail.tournament.status == 'upcoming' && detail.userEntries.isEmpty) ...[
                        if (detail.tournament.teamSize > 1)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(
                              'You can book up to ${detail.tournament.teamSize} seats in this mode.',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        SizedBox(
                          height: 54,
                          child: ElevatedButton(
                            onPressed: detail.tournament.isFull || _isJoining || _selectedSlots.isEmpty ? null : _handleJoin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: detail.tournament.isFull || _selectedSlots.isEmpty
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
                                        ? 'Tournament Full'
                                    : _selectedSlots.isEmpty
                                      ? 'Select Seat(s) to Join'
                                      : _selectedSlots.length == 1
                                        ? 'Join Seat #${_selectedSlots.first}'
                                        : 'Join ${_selectedSlots.length} Seats',
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      _SectionCard(
                        title: tx('Joined Players'),
                        child: detail.entries.isEmpty
                            ? Text(
                                tx('No players have joined this match yet.'),
                                style: const TextStyle(color: AppColors.textSecondary),
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
                          title: tx('Results & Rewards'),
                          child: Builder(
                            builder: (ctx) {
                              // Sort: by position asc; for same position put opponent first
                              final sorted = [...detail.results]..sort((a, b) {
                                if (a.position != b.position) {
                                  return a.position.compareTo(b.position);
                                }
                                // Tied: current user goes last (opponent shown first)
                                final cu = _currentUsername;
                                if (cu != null) {
                                  if (a.username == cu) return 1;
                                  if (b.username == cu) return -1;
                                }
                                return 0;
                              });
                              return Column(
                                children: sorted
                                    .map(
                                      (result) => Padding(
                                        padding: const EdgeInsets.only(bottom: 10),
                                        child: _ResultRow(
                                          result: result,
                                          category: detail.tournament.category,
                                        ),
                                      ),
                                    )
                                    .toList(),
                              );
                            },
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
    this.action,
  });

  final String title;
  final Widget child;
  final Widget? action;

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              ?action,
            ],
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
    this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback? onCopy;

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
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          if (onCopy != null) ...[
            const SizedBox(width: 10),
            InkWell(
              onTap: onCopy,
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.copy_rounded,
                  size: 18,
                  color: AppColors.accentBlue,
                ),
              ),
            ),
          ],
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
                if (entry.gameName != null && entry.gameName!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    '🎮 ${entry.gameName}',
                    style: const TextStyle(
                      color: AppColors.accentBlue,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  const _ResultRow({required this.result, required this.category});

  final MatchResultItem result;
  final String category;

  @override
  Widget build(BuildContext context) {
    final showKills = category == 'br';
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
          // Position badge
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: result.position == 1
                  ? const Color(0xFFFFD700).withValues(alpha: 0.18)
                  : AppColors.bgSecondary,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '#${result.position}',
              style: TextStyle(
                color: result.position == 1
                    ? const Color(0xFFD4A017)
                    : AppColors.textSecondary,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 12),
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
                  showKills
                      ? '@${result.username} • ${result.kills} kills'
                      : '@${result.username}',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                if (result.gameName != null && result.gameName!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    '🎮 ${result.gameName}',
                    style: const TextStyle(
                      color: AppColors.accentBlue,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
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

// ──────────────────────────────────────────────────────────────────────────────
// Theatre-style seat picker
// solo  → 5-column grid of numbered seats
// team  → vertical column per team (scrollable horizontally)
// States: available (teal), taken (red), your seat (blue), selected (gold)
// ──────────────────────────────────────────────────────────────────────────────

class _SeatPicker extends StatelessWidget {
  const _SeatPicker({
    required this.tournament,
    required this.entries,
    required this.userSlots,
    required this.selectedSlots,
    required this.maxSelectableSeats,
    required this.onSlotSelected,
  });

  final TournamentSummary tournament;
  final List<TournamentEntry> entries;
  final Set<int> userSlots;
  final Set<int> selectedSlots;
  final int maxSelectableSeats;
  final void Function(int slot)? onSlotSelected;

  @override
  Widget build(BuildContext context) {
    final maxPlayers = tournament.maxPlayers;
    final teamSize = tournament.teamSize;
    final isSolo = teamSize <= 1;

    final takenMap = <int, String>{};
    for (final e in entries) {
      takenMap[e.slotNumber] = e.username;
    }

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
          const Text(
            'Choose Your Seat',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              _LegendDot(color: const Color(0xFF2A9D8F), label: 'Available'),
              _LegendDot(color: AppColors.accentRed, label: 'Taken'),
              _LegendDot(color: AppColors.accentBlue, label: 'Your Seat'),
              if (onSlotSelected != null)
                _LegendDot(color: const Color(0xFFE9C46A), label: 'Selected'),
            ],
          ),
          const SizedBox(height: 18),
          if (isSolo)
            _SoloGrid(
              maxPlayers: maxPlayers,
              takenMap: takenMap,
              userSlots: userSlots,
              selectedSlots: selectedSlots,
              onSlotSelected: onSlotSelected,
            )
          else
            _TeamGrid(
              maxPlayers: maxPlayers,
              teamSize: teamSize,
              takenMap: takenMap,
              userSlots: userSlots,
              selectedSlots: selectedSlots,
              onSlotSelected: onSlotSelected,
            ),
          const SizedBox(height: 14),
          Text(
            '${entries.length}/$maxPlayers seats filled • Select up to $maxSelectableSeats',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SoloGrid extends StatelessWidget {
  const _SoloGrid({
    required this.maxPlayers,
    required this.takenMap,
    required this.userSlots,
    required this.selectedSlots,
    required this.onSlotSelected,
  });

  final int maxPlayers;
  final Map<int, String> takenMap;
  final Set<int> userSlots;
  final Set<int> selectedSlots;
  final void Function(int)? onSlotSelected;

  @override
  Widget build(BuildContext context) {
    const columns = 5;
    final rows = (maxPlayers / columns).ceil();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(rows, (row) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: List.generate(columns, (col) {
              final slot = row * columns + col + 1;
              if (slot > maxPlayers) return const Expanded(child: SizedBox());
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: _SeatTile(
                    slot: slot,
                    isTaken: takenMap.containsKey(slot),
                    takenBy: takenMap[slot],
                      isYours: userSlots.contains(slot),
                      isSelected: selectedSlots.contains(slot),
                    onTap: onSlotSelected != null &&
                        !takenMap.containsKey(slot) &&
                        !userSlots.contains(slot)
                        ? () => onSlotSelected!(slot)
                        : null,
                  ),
                ),
              );
            }),
          ),
        );
      }),
    );
  }
}

class _TeamGrid extends StatelessWidget {
  const _TeamGrid({
    required this.maxPlayers,
    required this.teamSize,
    required this.takenMap,
    required this.userSlots,
    required this.selectedSlots,
    required this.onSlotSelected,
  });

  final int maxPlayers;
  final int teamSize;
  final Map<int, String> takenMap;
  final Set<int> userSlots;
  final Set<int> selectedSlots;
  final void Function(int)? onSlotSelected;

  @override
  Widget build(BuildContext context) {
    final numTeams = (maxPlayers / teamSize).ceil();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(numTeams, (teamIdx) {
          final teamNo = teamIdx + 1;
          final startSlot = teamIdx * teamSize + 1;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.accentBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'T$teamNo',
                    style: const TextStyle(
                      color: AppColors.accentBlue,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                ...List.generate(teamSize, (memberIdx) {
                  final slot = startSlot + memberIdx;
                  if (slot > maxPlayers) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: _SeatTile(
                      slot: slot,
                      isTaken: takenMap.containsKey(slot),
                      takenBy: takenMap[slot],
                          isYours: userSlots.contains(slot),
                          isSelected: selectedSlots.contains(slot),
                      onTap: onSlotSelected != null &&
                              !takenMap.containsKey(slot) &&
                            !userSlots.contains(slot)
                          ? () => onSlotSelected!(slot)
                          : null,
                    ),
                  );
                }),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _SeatTile extends StatelessWidget {
  const _SeatTile({
    required this.slot,
    required this.isTaken,
    required this.isYours,
    required this.isSelected,
    this.takenBy,
    this.onTap,
  });

  final int slot;
  final bool isTaken;
  final bool isYours;
  final bool isSelected;
  final String? takenBy;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color fg;

    if (isYours) {
      bg = AppColors.accentBlue;
      fg = Colors.white;
    } else if (isSelected) {
      bg = const Color(0xFFE9C46A);
      fg = Colors.black87;
    } else if (isTaken) {
      bg = AppColors.accentRed.withValues(alpha: 0.15);
      fg = AppColors.accentRed;
    } else {
      bg = const Color(0xFF2A9D8F).withValues(alpha: 0.12);
      fg = const Color(0xFF2A9D8F);
    }

    // Username label: show first 6 chars if taken
    final String? nameLabel = (isTaken || isYours) && takenBy != null
        ? (takenBy!.length > 6 ? '${takenBy!.substring(0, 5)}…' : takenBy)
        : null;

    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: isYours
            ? 'Your seat (@${takenBy ?? ''})'
            : isTaken
                ? '@${takenBy ?? 'Taken'}'
                : 'Seat #$slot — tap to select',
        preferBelow: true,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 54,
          height: 62,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
            border: isSelected
                ? Border.all(color: const Color(0xFFE9C46A), width: 2.5)
                : isYours
                    ? Border.all(color: AppColors.accentBlue, width: 2)
                    : isTaken
                        ? null
                        : Border.all(
                            color: const Color(0xFF2A9D8F).withValues(alpha: 0.4),
                            width: 1,
                          ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isYours
                    ? Icons.person
                    : isTaken
                        ? Icons.person
                        : Icons.event_seat_outlined,
                size: 16,
                color: fg,
              ),
              const SizedBox(height: 1),
              Text(
                '#$slot',
                style: TextStyle(
                  color: fg,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (nameLabel != null) ...
                [
                  Text(
                    nameLabel,
                    maxLines: 1,
                    overflow: TextOverflow.clip,
                    style: TextStyle(
                      color: fg,
                      fontSize: 8,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

String _currency(double value) {
  if (value % 1 == 0) {
    return '₹${value.toStringAsFixed(0)}';
  }
  return '₹${value.toStringAsFixed(2)}';
}

// Game name + fee confirmation dialog.
// Uses StatefulWidget so TextEditingController is properly disposed via State.dispose().
class _GameNameDialog extends StatefulWidget {
  const _GameNameDialog({
    required this.entryFee,
    required this.walletBalance,
    required this.seatCount,
  });

  final double entryFee;
  final double walletBalance;
  final int seatCount;

  @override
  State<_GameNameDialog> createState() => _GameNameDialogState();
}

class _GameNameDialogState extends State<_GameNameDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fee = widget.entryFee * widget.seatCount;
    final balance = widget.walletBalance;
    final afterBalance = balance - fee;
    final canAfford = balance >= fee;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: const Text(
        'Enter Your In-Game Name',
        style: TextStyle(fontWeight: FontWeight.w900),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'This is the name you use inside the game.\nEmojis & special characters are allowed.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 8),
          Text(
            widget.seatCount > 1
                ? 'You selected ${widget.seatCount} seats.'
                : 'You selected 1 seat.',
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            autofocus: true,
            maxLength: 100,
            decoration: InputDecoration(
              hintText: 'e.g. FireKing🔥 or XxPlayerxX',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: canAfford
                  ? AppColors.accentGreen.withValues(alpha: 0.07)
                  : AppColors.accentRed.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: canAfford
                    ? AppColors.accentGreen.withValues(alpha: 0.25)
                    : AppColors.accentRed.withValues(alpha: 0.25),
              ),
            ),
            child: Column(
              children: [
                _FeeLine(
                  label: widget.seatCount > 1 ? 'Entry fee total' : 'Entry fee',
                  value: '− ₹${fee % 1 == 0 ? fee.toStringAsFixed(0) : fee.toStringAsFixed(2)}',
                  valueColor: AppColors.accentRed,
                ),
                const SizedBox(height: 6),
                _FeeLine(
                  label: 'Wallet balance',
                  value: '₹${balance % 1 == 0 ? balance.toStringAsFixed(0) : balance.toStringAsFixed(2)}',
                  valueColor: AppColors.textPrimary,
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 6),
                  child: Divider(height: 1),
                ),
                _FeeLine(
                  label: 'Balance after join',
                  value: '₹${afterBalance % 1 == 0 ? afterBalance.toStringAsFixed(0) : afterBalance.toStringAsFixed(2)}',
                  valueColor: canAfford ? AppColors.accentGreen : AppColors.accentRed,
                  bold: true,
                ),
                if (!canAfford) ...
                  [
                    const SizedBox(height: 8),
                    const Text(
                      'Insufficient balance — add money in Wallet tab.',
                      style: TextStyle(
                        color: AppColors.accentRed,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: canAfford ? AppColors.accentRed : AppColors.textMuted,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          onPressed: canAfford
              ? () {
                  final name = _controller.text.trim();
                  if (name.isEmpty) return;
                  Navigator.pop(context, name);
                }
              : null,
          child: const Text('Confirm & Join'),
        ),
      ],
    );
  }
}

class _FeeLine extends StatelessWidget {
  const _FeeLine({
    required this.label,
    required this.value,
    required this.valueColor,
    this.bold = false,
  });

  final String label;
  final String value;
  final Color valueColor;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

