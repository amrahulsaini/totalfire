const List<String> _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/// Format a DateTime as "03 Apr 2026 • 6:30 PM"
String formatDateTime(DateTime value) {
  final local = value.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = _months[local.month - 1];
  final year = local.year;
  final rawHour = local.hour;
  final hour = rawHour > 12 ? rawHour - 12 : (rawHour == 0 ? 12 : rawHour);
  final minute = local.minute.toString().padLeft(2, '0');
  final suffix = rawHour >= 12 ? 'PM' : 'AM';
  return '$day $month $year • $hour:$minute $suffix';
}

/// Return a human-readable countdown like "2h 15m left" or "Started"
String timeLeft(DateTime startTime) {
  final now = DateTime.now();
  final diff = startTime.toLocal().difference(now);

  if (diff.isNegative) return 'Started';

  final days = diff.inDays;
  final hours = diff.inHours % 24;
  final minutes = diff.inMinutes % 60;

  if (days > 0) return '${days}d ${hours}h left';
  if (hours > 0) return '${hours}h ${minutes}m left';
  if (minutes > 0) return '${minutes}m left';
  return 'Starting soon';
}

/// Combined: "03 Apr • 6:30 PM — 2h 15m left"
String formatDateTimeWithCountdown(DateTime value) {
  final local = value.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = _months[local.month - 1];
  final rawHour = local.hour;
  final hour = rawHour > 12 ? rawHour - 12 : (rawHour == 0 ? 12 : rawHour);
  final minute = local.minute.toString().padLeft(2, '0');
  final suffix = rawHour >= 12 ? 'PM' : 'AM';
  final countdown = timeLeft(value);
  return '$day $month • $hour:$minute $suffix — $countdown';
}
