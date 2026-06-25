import 'package:flutter/material.dart';

/// iOS-style slide-from-right with subtle counter-slide of the outgoing route.
class PhysioPageRoute<T> extends PageRouteBuilder<T> {
  PhysioPageRoute({required WidgetBuilder builder, super.settings})
      : super(
          pageBuilder: (context, animation, _) => builder(context),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final slideIn = Tween(
              begin: const Offset(1.0, 0.0),
              end: Offset.zero,
            ).chain(CurveTween(curve: Curves.easeOutCubic)).animate(animation);

            final slideOut = Tween(
              begin: Offset.zero,
              end: const Offset(-0.25, 0.0),
            )
                .chain(CurveTween(curve: Curves.easeInCubic))
                .animate(secondaryAnimation);

            return SlideTransition(
              position: slideOut,
              child: SlideTransition(position: slideIn, child: child),
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
          reverseTransitionDuration: const Duration(milliseconds: 220),
        );
}

/// Fade-only transition — used for top-level auth → home transitions.
class PhysioFadeRoute<T> extends PageRouteBuilder<T> {
  PhysioFadeRoute({required WidgetBuilder builder, super.settings})
      : super(
          pageBuilder: (context, animation, _) => builder(context),
          transitionsBuilder: (context, animation, _, child) => FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOut),
            child: child,
          ),
          transitionDuration: const Duration(milliseconds: 350),
          reverseTransitionDuration: const Duration(milliseconds: 250),
        );
}
