import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/three_dots_loader.dart';
import 'mode_detail_screen.dart';

String _currency(double value) => '₹${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 2)}';

class CategoryModesScreen extends StatefulWidget {
  const CategoryModesScreen({
    super.key,
    required this.category,
    required this.categoryLabel,
    required this.modes,
  });

  final String category;
  final String categoryLabel;
  final List<ModeCatalogItem> modes;

  @override
  State<CategoryModesScreen> createState() => _CategoryModesScreenState();
}

class _CategoryModesScreenState extends State<CategoryModesScreen> {
  List<ModeCatalogItem> _modes = const [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _modes = widget.modes;
  }

  Future<void> _refresh() async {
    setState(() => _isLoading = true);
    try {
      final all = await ApiService.getModes();
      if (!mounted) return;
      setState(() {
        _modes = all.where((m) => m.category == widget.category).toList();
      });
    } catch (_) {} finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openMode(ModeCatalogItem mode) async {
    await Navigator.push(
      context,
      _FadeRoute(child: ModeDetailScreen(modeSlug: mode.slug)),
    );
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.categoryLabel,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: ThreeDotsLoader())
          : RefreshIndicator(
              onRefresh: _refresh,
              color: AppColors.accentRed,
              child: _modes.isEmpty
                  ? const Center(
                      child: Text(
                        'No modes available in this category.',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                      itemCount: _modes.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: _CategoryModeCard(
                            mode: _modes[index],
                            onTap: () => _openMode(_modes[index]),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class _CategoryModeCard extends StatelessWidget {
  const _CategoryModeCard({required this.mode, required this.onTap});

  final ModeCatalogItem mode;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final rewardText = mode.winPrize ??
        '${_currency(mode.perKill ?? 0)}/Kill  •  Pool ${_currency(mode.prizePool ?? 0)}';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: Stack(
                children: [
                  Image.network(
                    ApiService.resolveAssetUrl(mode.appImage),
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    loadingBuilder: (ctx, child, progress) {
                      if (progress == null) return child;
                      return Container(
                        height: 200,
                        alignment: Alignment.center,
                        color: AppColors.bgSecondary,
                        child: const ThreeDotsLoader(dotSize: 9),
                      );
                    },
                    errorBuilder: (ctx, err, _) => Container(
                      height: 200,
                      color: AppColors.accentBlue,
                      alignment: Alignment.center,
                      child: const Icon(Icons.image_not_supported_outlined, size: 48, color: Colors.white),
                    ),
                  ),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.65)],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 16,
                    child: Text(
                      mode.title,
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
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.people_outline, size: 18, color: AppColors.textMuted),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          mode.players,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.accentGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Entry ${_currency(mode.entryFee)}',
                          style: const TextStyle(
                            color: AppColors.accentGreen,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.bgSecondary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      rewardText,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onTap,
                      child: const Text('View Tournaments'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Page route with a smooth fade transition.
class _FadeRoute extends PageRoute<void> {
  _FadeRoute({required this.child});

  final Widget child;

  @override
  Color? get barrierColor => null;

  @override
  String? get barrierLabel => null;

  @override
  bool get maintainState => true;

  @override
  Duration get transitionDuration => const Duration(milliseconds: 260);

  @override
  Widget buildPage(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }
}
