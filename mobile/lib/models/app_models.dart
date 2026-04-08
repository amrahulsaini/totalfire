class RewardBreakdownItem {
  const RewardBreakdownItem({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  factory RewardBreakdownItem.fromJson(Map<String, dynamic> json) {
    return RewardBreakdownItem(
      label: _stringValue(json['label']),
      value: _stringValue(json['value']),
    );
  }
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.fullName,
    required this.username,
    required this.email,
    required this.mobile,
    this.role,
  });

  final int id;
  final String fullName;
  final String username;
  final String email;
  final String mobile;
  final String? role;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: _intValue(json['id']),
      fullName: _stringValue(json['fullName']),
      username: _stringValue(json['username']),
      email: _stringValue(json['email']),
      mobile: _stringValue(json['mobile']),
      role: _nullableStringValue(json['role']),
    );
  }
}

class ModeCatalogItem {
  const ModeCatalogItem({
    required this.id,
    required this.title,
    required this.slug,
    required this.image,
    required this.appImage,
    required this.category,
    required this.players,
    required this.maxPlayers,
    required this.teamSize,
    required this.entryFee,
    required this.perKill,
    required this.prizePool,
    required this.winPrize,
    required this.fullDescription,
    required this.rules,
    required this.rewardBreakdown,
  });

  final int id;
  final String title;
  final String slug;
  final String image;
  final String appImage;
  final String category;
  final String players;
  final int maxPlayers;
  final int teamSize;
  final double entryFee;
  final double? perKill;
  final double? prizePool;
  final String? winPrize;
  final String fullDescription;
  final List<String> rules;
  final List<RewardBreakdownItem> rewardBreakdown;

  factory ModeCatalogItem.fromJson(Map<String, dynamic> json) {
    final rulesRaw = json['rules'] as List<dynamic>? ?? const [];
    final rewardRaw = json['rewardBreakdown'] as List<dynamic>? ?? const [];

    return ModeCatalogItem(
      id: _intValue(json['id']),
      title: _stringValue(json['title']),
      slug: _stringValue(json['slug']),
      image: _stringValue(json['image']),
      appImage: _stringValue(json['appImage']),
      category: _stringValue(json['category']),
      players: _stringValue(json['players']),
      maxPlayers: _intValue(json['maxPlayers']),
      teamSize: _intValue(json['teamSize']),
      entryFee: _doubleValue(json['entryFee']),
      perKill: _nullableDoubleValue(json['perKill']),
      prizePool: _nullableDoubleValue(json['prizePool']),
      winPrize: _nullableStringValue(json['winPrize']),
      fullDescription: _stringValue(json['fullDescription']),
      rules: rulesRaw.map((item) => item.toString()).toList(),
      rewardBreakdown: rewardRaw
          .whereType<Map<String, dynamic>>()
          .map(RewardBreakdownItem.fromJson)
          .toList(),
    );
  }
}

class TournamentSummary {
  const TournamentSummary({
    required this.id,
    required this.matchId,
    required this.modeId,
    required this.title,
    required this.modeSlug,
    required this.category,
    required this.maxPlayers,
    required this.teamSize,
    required this.entryFee,
    required this.perKill,
    required this.winPrize,
    required this.prizePool,
    required this.roomId,
    required this.roomPassword,
    required this.startTime,
    required this.status,
    required this.isActive,
    required this.currentPlayers,
    required this.slotNumber,
    required this.teamNumber,
    required this.entryStatus,
  });

  final int id;
  final String matchId;
  final int modeId;
  final String title;
  final String modeSlug;
  final String category;
  final int maxPlayers;
  final int teamSize;
  final double entryFee;
  final double perKill;
  final String? winPrize;
  final double prizePool;
  final String? roomId;
  final String? roomPassword;
  final DateTime startTime;
  final String status;
  final bool isActive;
  final int currentPlayers;
  final int? slotNumber;
  final int? teamNumber;
  final String? entryStatus;

  bool get isFull => currentPlayers >= maxPlayers;

  factory TournamentSummary.fromJson(Map<String, dynamic> json) {
    return TournamentSummary(
      id: _intValue(json['id']),
      matchId: _stringValue(json['match_id']),
      modeId: _intValue(json['mode_id']),
      title: _stringValue(json['title']),
      modeSlug: _stringValue(json['mode_slug']),
      category: _stringValue(json['category']),
      maxPlayers: _intValue(json['max_players']),
      teamSize: _intValue(json['team_size']),
      entryFee: _doubleValue(json['entry_fee']),
      perKill: _doubleValue(json['per_kill']),
      winPrize: _nullableStringValue(json['win_prize']),
      prizePool: _doubleValue(json['prize_pool']),
      roomId: _nullableStringValue(json['room_id']),
      roomPassword: _nullableStringValue(json['room_password']),
      startTime: _dateValue(json['start_time']),
      status: _stringValue(json['status']),
      isActive: _boolValue(json['is_active']),
      currentPlayers: _intValue(json['current_players']),
      slotNumber: _nullableIntValue(json['slot_number']),
      teamNumber: _nullableIntValue(json['team_number']),
      entryStatus: _nullableStringValue(json['entry_status']),
    );
  }
}

class TournamentEntry {
  const TournamentEntry({
    required this.username,
    required this.fullName,
    required this.slotNumber,
    required this.teamNumber,
    required this.status,
    this.gameName,
  });

  final String username;
  final String fullName;
  final int slotNumber;
  final int? teamNumber;
  final String? status;
  final String? gameName;

  factory TournamentEntry.fromJson(Map<String, dynamic> json) {
    return TournamentEntry(
      username: _stringValue(json['username']),
      fullName: _stringValue(json['full_name']),
      slotNumber: _intValue(json['slot_number']),
      teamNumber: _nullableIntValue(json['team_number']),
      status: _nullableStringValue(json['status']),
      gameName: _nullableStringValue(json['game_name']),
    );
  }
}

class UserTournamentEntry {
  const UserTournamentEntry({
    required this.slotNumber,
    required this.teamNumber,
    required this.status,
  });

  final int slotNumber;
  final int? teamNumber;
  final String? status;

  factory UserTournamentEntry.fromJson(Map<String, dynamic> json) {
    return UserTournamentEntry(
      slotNumber: _intValue(json['slot_number']),
      teamNumber: _nullableIntValue(json['team_number']),
      status: _nullableStringValue(json['status']),
    );
  }
}

class MatchResultItem {
  const MatchResultItem({
    required this.username,
    required this.fullName,
    required this.kills,
    required this.rewardAmount,
    required this.isWinner,
    required this.position,
    this.gameName,
  });

  final String username;
  final String fullName;
  final int kills;
  final double rewardAmount;
  final bool isWinner;
  final int position;
  final String? gameName;

  factory MatchResultItem.fromJson(Map<String, dynamic> json) {
    return MatchResultItem(
      username: _stringValue(json['username']),
      fullName: _stringValue(json['full_name']),
      kills: _intValue(json['kills']),
      rewardAmount: _doubleValue(json['reward_amount']),
      isWinner: _boolValue(json['is_winner']),
      position: _intValue(json['position']),
      gameName: _nullableStringValue(json['game_name']),
    );
  }
}

class TournamentDetail {
  const TournamentDetail({
    required this.tournament,
    required this.entries,
    required this.results,
    required this.userEntry,
  });

  final TournamentSummary tournament;
  final List<TournamentEntry> entries;
  final List<MatchResultItem> results;
  final UserTournamentEntry? userEntry;

  factory TournamentDetail.fromJson(Map<String, dynamic> json) {
    final entryList = json['entries'] as List<dynamic>? ?? const [];
    final resultList = json['results'] as List<dynamic>? ?? const [];
    final userEntry = json['userEntry'];

    return TournamentDetail(
      tournament: TournamentSummary.fromJson(
        json['tournament'] as Map<String, dynamic>? ?? const {},
      ),
      entries: entryList
          .whereType<Map<String, dynamic>>()
          .map(TournamentEntry.fromJson)
          .toList(),
      results: resultList
          .whereType<Map<String, dynamic>>()
          .map(MatchResultItem.fromJson)
          .toList(),
      userEntry: userEntry is Map<String, dynamic>
          ? UserTournamentEntry.fromJson(userEntry)
          : null,
    );
  }
}

class WalletTransactionItem {
  const WalletTransactionItem({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.referenceId,
    required this.createdAt,
  });

  final int id;
  final double amount;
  final String type;
  final String description;
  final String? referenceId;
  final DateTime createdAt;

  factory WalletTransactionItem.fromJson(Map<String, dynamic> json) {
    return WalletTransactionItem(
      id: _intValue(json['id']),
      amount: _doubleValue(json['amount']),
      type: _stringValue(json['type']),
      description: _stringValue(json['description']),
      referenceId: _nullableStringValue(json['reference_id']),
      createdAt: _dateValue(json['created_at']),
    );
  }
}

String _stringValue(dynamic value) => value?.toString() ?? '';

String? _nullableStringValue(dynamic value) {
  if (value == null) {
    return null;
  }

  final parsed = value.toString();
  return parsed.isEmpty ? null : parsed;
}

int _intValue(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is double) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

int? _nullableIntValue(dynamic value) {
  if (value == null) {
    return null;
  }
  return _intValue(value);
}

double _doubleValue(dynamic value) {
  if (value is double) {
    return value;
  }
  if (value is int) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? 0;
  }
  return 0;
}

double? _nullableDoubleValue(dynamic value) {
  if (value == null) {
    return null;
  }
  return _doubleValue(value);
}

bool _boolValue(dynamic value) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    return value == '1' || value.toLowerCase() == 'true';
  }
  return false;
}

DateTime _dateValue(dynamic value) {
  if (value is DateTime) {
    return value.isUtc ? value.toLocal() : value;
  }

  final str = (value?.toString() ?? '').trim();
  if (str.isEmpty) return DateTime.now();

  // MySQL with dateStrings:true returns "2026-04-03 15:20:00" (no offset = local IST).
  // Normalise the space to T so Dart can parse it.
  final normalised = str.replaceFirst(' ', 'T');
  final parsed = DateTime.tryParse(normalised);
  if (parsed == null) return DateTime.now();

  // If the string had a Z or +00 it is UTC — convert to local.
  return parsed.isUtc ? parsed.toLocal() : parsed;
}

class WithdrawalRequestItem {
  const WithdrawalRequestItem({
    required this.id,
    required this.amount,
    required this.status,
    required this.method,
    required this.accountDetails,
    required this.upiId,
    required this.createdAt,
    required this.processedAt,
    required this.adminNote,
  });

  final int id;
  final double amount;
  final String status;
  final String? method;
  final String? accountDetails;
  final String? upiId;
  final DateTime createdAt;
  final DateTime? processedAt;
  final String? adminNote;

  factory WithdrawalRequestItem.fromJson(Map<String, dynamic> json) {
    final processedAtRaw = json['processed_at'];
    return WithdrawalRequestItem(
      id: _intValue(json['id']),
      amount: _doubleValue(json['amount']),
      status: _stringValue(json['status']),
      method: _nullableStringValue(json['method']),
      accountDetails: _nullableStringValue(json['account_details']),
      upiId: _nullableStringValue(json['upi_id']),
      createdAt: _dateValue(json['created_at']),
      processedAt: processedAtRaw == null ? null : _dateValue(processedAtRaw),
      adminNote: _nullableStringValue(json['admin_note']),
    );
  }
}

class AppNotificationItem {
  const AppNotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.payload,
  });

  final int id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? payload;

  factory AppNotificationItem.fromJson(Map<String, dynamic> json) {
    return AppNotificationItem(
      id: _intValue(json['id']),
      type: _stringValue(json['type']),
      title: _stringValue(json['title']),
      message: _stringValue(json['message']),
      isRead: _boolValue(json['is_read']),
      createdAt: _dateValue(json['created_at']),
      payload: _nullableMapValue(json['payload']),
    );
  }
}

Map<String, dynamic>? _nullableMapValue(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map(
      (key, val) => MapEntry(key.toString(), val),
    );
  }
  return null;
}