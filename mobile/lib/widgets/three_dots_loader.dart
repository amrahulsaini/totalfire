import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Animated three-dot loader that bounces dots in sequence.
class ThreeDotsLoader extends StatefulWidget {
  const ThreeDotsLoader({
    super.key,
    this.dotColor,
    this.dotSize = 10.0,
    this.spacing = 7.0,
  });

  final Color? dotColor;
  final double dotSize;
  final double spacing;

  @override
  State<ThreeDotsLoader> createState() => _ThreeDotsLoaderState();
}

class _ThreeDotsLoaderState extends State<ThreeDotsLoader>
    with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _anims;

  static const _duration = Duration(milliseconds: 550);
  static const _delay = Duration(milliseconds: 160);

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      3,
      (i) => AnimationController(vsync: this, duration: _duration),
    );
    _anims = _controllers.map((c) {
      return Tween<double>(begin: 0, end: -12).animate(
        CurvedAnimation(parent: c, curve: Curves.easeInOut),
      );
    }).toList();

    _startLoop();
  }

  void _startLoop() async {
    await Future.delayed(const Duration(milliseconds: 80));
    while (mounted) {
      for (int i = 0; i < 3; i++) {
        if (!mounted) return;
        _controllers[i].forward().then((_) {
          if (mounted) _controllers[i].reverse();
        });
        await Future.delayed(_delay);
      }
      await Future.delayed(const Duration(milliseconds: 300));
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.dotColor ?? AppColors.accentRed;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: widget.spacing / 2),
          child: AnimatedBuilder(
            animation: _anims[i],
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(0, _anims[i].value),
                child: child,
              );
            },
            child: Container(
              width: widget.dotSize,
              height: widget.dotSize,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      }),
    );
  }
}

/// Full-screen loading scaffold with the three dots loader.
class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: ThreeDotsLoader()),
    );
  }
}
