import 'package:flutter/material.dart';

const _services = [
  ('Musculoskeletal Physiotherapy', 'Back pain, neck pain, tendon pain and persistent strain rehabilitation.'),
  ('Post-Surgical Rehabilitation', 'Recovery support after joint replacement, ligament reconstruction and orthopaedic surgery.'),
  ('Neurological Rehabilitation', 'Mobility, gait and functional support for neurological conditions.'),
  ('Paediatric Physiotherapy', 'Family-guided rehab and movement support for children.'),
];

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          Text('Services', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'A mobile-friendly view of the same core services available in the web platform.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          ..._services.map(
            (service) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(service.$1, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Text(service.$2, style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
