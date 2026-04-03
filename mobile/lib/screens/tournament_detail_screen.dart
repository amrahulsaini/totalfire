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
  int? _selectedSlot;

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
    if (detail == null) return;

    // Step 1: collect in-game name
    final gameNameController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
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
              'This is the name you use inside the game (emojis & special characters allowed).',
              style: TextStyle(color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: gameNameController,
              autofocus: true,
              maxLength: 100,
              decoration: InputDecoration(
                hintText: 'e.g. FireKing🔥 or XxPlayerxX',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentRed,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () {
              if (gameNameController.text.trim().isEmpty) return;
              Navigator.pop(ctx, true);
            },
            child: const Text('Confirm & Join'),
          ),
        ],
      ),
    );

    if (!mounted || confirmed != true) {
      gameNameController.dispose();
      return;
    }

    final gameName = gameNameController.text.trim();
    gameNameController.dispose();

    // Step 2: join tournament
    setState(() => _isJoining = true);
    final response = await ApiService.joinTournament(
      detail.tournament.id,
      gameName: gameName,
      preferredSlot: _selectedSlot,
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
                      _SeatPicker(
                        tournament: detail.tournament,
                        entries: detail.entries,
                        userEntry: detail.userEntry,
                        selectedSlot: _selectedSlot,
                        onSlotSelected: detail.userEntry == null && detail.tournament.status == 'upcoming'
                            ? (slot) => setState(() => _selectedSlot = slot)
                            : null,
                      ),
                      const SizedBox(height: 16),
                      if (detail.tournament.status == 'upcoming' && detail.userEntry == null) ...[
                        SizedBox(
                          height: 54,
                          child: ElevatedButton(
                            onPressed: detail.tournament.isFull || _isJoining || _selectedSlot == null ? null : _handleJoin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: detail.tournament.isFull || _selectedSlot == null
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
                                        : _selectedSlot == null
                                            ? 'Select a Seat to Join'
                                            : 'Join Seat #$_selectedSlot',
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
    required this.userEntry,
    required this.selectedSlot,
    required this.onSlotSelected,
  });

  final TournamentSummary tournament;
  final List<TournamentEntry> entries;
  final UserTournamentEntry? userEntry;
  final int? selectedSlot;
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
              userSlot: userEntry?.slotNumber,
              selectedSlot: selectedSlot,
              onSlotSelected: onSlotSelected,
            )
          else
            _TeamGrid(
              maxPlayers: maxPlayers,
              teamSize: teamSize,
              takenMap: takenMap,
              userSlot: userEntry?.slotNumber,
              selectedSlot: selectedSlot,
              onSlotSelected: onSlotSelected,
            ),
          const SizedBox(height: 14),
          Text(
            '${entries.length}/$maxPlayers seats filled',
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
    required this.userSlot,
    required this.selectedSlot,
    required this.onSlotSelected,
  });

  final int maxPlayers;
  final Map<int, String> takenMap;
  final int? userSlot;
  final int? selectedSlot;
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
                    isYours: userSlot == slot,
                    isSelected: selectedSlot == slot,
                    onTap: onSlotSelected != null &&
                            !takenMap.containsKey(slot) &&
                            userSlot == null
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
    required this.userSlot,
    required this.selectedSlot,
    required this.onSlotSelected,
  });

  final int maxPlayers;
  final int teamSize;
  final Map<int, String> takenMap;
  final int? userSlot;
  final int? selectedSlot;
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
                      isYours: userSlot == slot,
                      isSelected: selectedSlot == slot,
                      onTap: onSlotSelected != null &&
                              !takenMap.containsKey(slot) &&
                              userSlot == null
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

    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: isYours
            ? 'Your seat'
            : isTaken
                ? takenBy ?? 'Taken'
                : 'Seat #$slot — tap to select',
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 54,
          height: 54,
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
                        ? Icons.person_off_outlined
                        : Icons.event_seat_outlined,
                size: 18,
                color: fg,
              ),
              const SizedBox(height: 2),
              Text(
                '#$slot',
                style: TextStyle(
                  color: fg,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
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

