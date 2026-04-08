import 'package:flutter/material.dart';
import '../l10n/app_localization.dart';
import '../services/language_service.dart';
import '../theme/app_theme.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({
    super.key,
    required this.onSelected,
  });

  final VoidCallback onSelected;

  @override
  State<LanguageSelectionScreen> createState() => _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  bool _saving = false;

  Future<void> _selectLanguage(String code) async {
    if (_saving) {
      return;
    }

    setState(() => _saving = true);
    await LanguageService.setLanguage(
      code,
      markSelected: true,
      syncCloud: true,
    );

    if (!mounted) {
      return;
    }

    setState(() => _saving = false);
    widget.onSelected();
  }

  @override
  Widget build(BuildContext context) {
    final tx = context.tx;

    return Scaffold(
      body: SafeArea(
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFFF6F3), Colors.white],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 30, 22, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                Text(
                  tx('Choose App Language'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  tx('Select your preferred language. You can change it anytime from settings.'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 30),
                _LanguageCard(
                  title: tx('English'),
                  subtitle: 'Continue in English',
                  icon: Icons.language,
                  color: AppColors.accentBlue,
                  onTap: _saving ? null : () => _selectLanguage('en'),
                ),
                const SizedBox(height: 14),
                _LanguageCard(
                  title: tx('Hindi'),
                  subtitle: 'हिंदी में जारी रखें',
                  icon: Icons.translate_rounded,
                  color: AppColors.accentOrange,
                  onTap: _saving ? null : () => _selectLanguage('hi'),
                ),
                const Spacer(),
                if (_saving)
                  const Center(
                    child: CircularProgressIndicator(strokeWidth: 2.4),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LanguageCard extends StatelessWidget {
  const _LanguageCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: color.withValues(alpha: 0.25)),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.12),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
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
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
