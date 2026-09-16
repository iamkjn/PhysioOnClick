import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../appointments/appointments_screen.dart';
import 'checkout_repository.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final CheckoutStatus status;
  const BookingConfirmationScreen({required this.status, super.key});

  @override
  Widget build(BuildContext context) {
    final (icon, title, message) = switch (status.status) {
      'paid' => (
          Icons.check_circle,
          'All set',
          'Your appointment is confirmed${status.invoiceNumber != null ? " — invoice ${status.invoiceNumber}" : ""}.'
        ),
      'slot_unavailable' || 'booking_failed' => (
          Icons.error_outline,
          'We hit a snag',
          "Your payment went through but we couldn't confirm the slot. We'll contact you shortly to sort it out."
        ),
      _ => (
          Icons.hourglass_top,
          'Almost there',
          "We're still finishing up your booking — this can take a minute. Check Appointments shortly."
        ),
    };
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Booking'), automaticallyImplyLeading: false),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 64, color: AppColors.teal),
              const SizedBox(height: 16),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    PhysioFadeRoute(builder: (_) => const AppointmentsScreen()),
                    (route) => route.isFirst,
                  );
                },
                child: const Text('View appointments'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
