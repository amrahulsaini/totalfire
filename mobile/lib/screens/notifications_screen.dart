import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/time_utils.dart';
import '../widgets/three_dots_loader.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotificationItem> _items = const [];
  bool _isLoading = true;
  bool _isBusy = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final result = await ApiService.getNotifications(limit: 100);
      if (!mounted) {
        return;
      }
      setState(() {
        _items = result.items;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _isLoading = false);
      _showMessage(error.toString(), isError: true);
    }
  }

  Future<void> _markAllRead() async {
    setState(() => _isBusy = true);
    final response = await ApiService.markAllNotificationsRead();
    if (!mounted) {
      return;
    }

    if (!response.success) {
      setState(() => _isBusy = false);
      _showMessage(response.message, isError: true);
      return;
    }

    setState(() {
      _items = _items
          .map(
            (item) => AppNotificationItem(
              id: item.id,
              type: item.type,
              title: item.title,
              message: item.message,
              isRead: true,
              createdAt: item.createdAt,
              payload: item.payload,
            ),
          )
          .toList();
      _isBusy = false;
    });
  }

  Future<void> _deleteAll() async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete all notifications?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete All'),
          ),
        ],
      ),
    );

    if (shouldDelete != true) {
      return;
    }

    setState(() => _isBusy = true);
    final response = await ApiService.deleteAllNotifications();
    if (!mounted) {
      return;
    }

    if (!response.success) {
      setState(() => _isBusy = false);
      _showMessage(response.message, isError: true);
      return;
    }

    setState(() {
      _items = const [];
      _isBusy = false;
    });
  }

  Future<void> _markRead(AppNotificationItem item) async {
    if (item.isRead) {
      return;
    }

    final response = await ApiService.markNotificationRead(item.id, isRead: true);
    if (!mounted || !response.success) {
      return;
    }

    setState(() {
      _items = _items
          .map((entry) => entry.id == item.id
              ? AppNotificationItem(
                  id: entry.id,
                  type: entry.type,
                  title: entry.title,
                  message: entry.message,
                  isRead: true,
                  createdAt: entry.createdAt,
                  payload: entry.payload,
                )
              : entry)
          .toList();
    });
  }

  Future<void> _deleteItem(AppNotificationItem item) async {
    final response = await ApiService.deleteNotification(item.id);
    if (!mounted) {
      return;
    }

    if (!response.success) {
      _showMessage(response.message, isError: true);
      return;
    }

    setState(() {
      _items = _items.where((entry) => entry.id != item.id).toList();
    });
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            tooltip: 'Mark all read',
            onPressed: _isBusy || _items.isEmpty ? null : _markAllRead,
            icon: const Icon(Icons.done_all),
          ),
          IconButton(
            tooltip: 'Delete all',
            onPressed: _isBusy || _items.isEmpty ? null : _deleteAll,
            icon: const Icon(Icons.delete_sweep_outlined),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: _items.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(20),
                      children: const [
                        SizedBox(height: 80),
                        _EmptyNotificationCard(),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                      itemCount: _items.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = _items[index];
                        return _NotificationCard(
                          item: item,
                          onTap: () => _markRead(item),
                          onDelete: () => _deleteItem(item),
                        );
                      },
                    ),
            ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.item,
    required this.onTap,
    required this.onDelete,
  });

  final AppNotificationItem item;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final iconColor = _typeColor(item.type);
    final tileColor = item.isRead ? Colors.white : const Color(0xFFFFF5F2);

    return Material(
      color: tileColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: item.isRead ? const Color(0xFFE9E6E2) : const Color(0xFFFEC7B2),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_typeIcon(item.type), color: iconColor, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.accentRed,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.message,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      formatDateTime(item.createdAt),
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline),
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyNotificationCard extends StatelessWidget {
  const _EmptyNotificationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Column(
        children: [
          Icon(Icons.notifications_none_rounded, size: 40, color: AppColors.textMuted),
          SizedBox(height: 10),
          Text(
            'No notifications yet',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Wallet updates, withdrawal actions, and tournament events will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
        ],
      ),
    );
  }
}

Color _typeColor(String type) {
  switch (type) {
    case 'wallet':
      return AppColors.accentGreen;
    case 'withdrawal':
      return AppColors.accentOrange;
    case 'tournament':
      return AppColors.accentBlue;
    default:
      return AppColors.textSecondary;
  }
}

IconData _typeIcon(String type) {
  switch (type) {
    case 'wallet':
      return Icons.account_balance_wallet_outlined;
    case 'withdrawal':
      return Icons.south_west_rounded;
    case 'tournament':
      return Icons.emoji_events_outlined;
    default:
      return Icons.notifications_none_rounded;
  }
}
