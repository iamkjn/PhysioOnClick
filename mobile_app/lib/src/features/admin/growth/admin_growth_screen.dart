import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/app_colors.dart';

const _pageSize = 20;

const _eventLabels = {
  'page_view': 'Page viewed',
  'book_now_click': 'Booking CTA clicked',
  'service_view': 'Service page viewed',
  'service_click': 'Service card clicked',
  'library_view': 'Exercise guide viewed',
  'exercise_click': 'Exercise opened',
  'exercise_plan_saved': 'Exercise saved to plan',
  'exercise_booking_intent': 'Exercise-to-booking click',
  'saved_plan_booking_intent': 'Saved-plan booking click',
  'condition_click': 'Condition programme opened',
  'booking_service_selected': 'Booking service chosen',
  'booking_slot_selected': 'Booking slot chosen',
  'checkout_started': 'Checkout started',
  'discount_applied': 'Discount applied',
  'booking_confirmed': 'Booking confirmed',
  'chat_opened': 'Patient chat opened',
  'chat_message_sent': 'Patient chat message',
  'chat_booking_intent': 'Chat booking intent',
};

class _GrowthEvent {
  const _GrowthEvent({
    required this.id,
    required this.event,
    required this.path,
    required this.raw,
  });

  final String id;
  final String event;
  final String path;
  final Map<String, dynamic> raw;

  String get device => '${raw['device'] ?? 'device'}';
  String get sessionId => '${raw['sessionId'] ?? ''}';
  String get country {
    final name = '${raw['countryName'] ?? ''}'.trim();
    if (name.isNotEmpty) return name;
    final code = '${raw['countryCode'] ?? ''}'.trim();
    if (code.isNotEmpty) return code;
    return 'Country not captured';
  }

  Map<String, dynamic> get params {
    final value = raw['params'];
    return value is Map ? Map<String, dynamic>.from(value) : const {};
  }

  String param(String key) => '${params[key] ?? ''}'.trim();
}

class _MetricConfig {
  const _MetricConfig({
    required this.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.filter,
    required this.empty,
  });

  final String key;
  final String title;
  final String subtitle;
  final IconData icon;
  final bool Function(_GrowthEvent event) filter;
  final String empty;
}

final _metrics = <_MetricConfig>[
  _MetricConfig(
    key: 'sessions',
    title: 'Tracked visitor sessions',
    subtitle: 'Review latest activity',
    icon: Icons.monitor_heart_rounded,
    filter: (event) => event.sessionId.isNotEmpty,
    empty: 'No patient sessions have been tracked yet.',
  ),
  _MetricConfig(
    key: 'book-clicks',
    title: 'Book clicks',
    subtitle: 'Open click records',
    icon: Icons.ads_click_rounded,
    filter: (event) => event.event == 'book_now_click',
    empty: 'No booking CTA clicks have been tracked yet.',
  ),
  _MetricConfig(
    key: 'checkout-starts',
    title: 'Checkout starts',
    subtitle: 'Open checkout records',
    icon: Icons.call_made_rounded,
    filter: (event) => event.event == 'checkout_started',
    empty: 'No checkout starts have been tracked yet.',
  ),
  _MetricConfig(
    key: 'confirmed',
    title: 'Confirmed',
    subtitle: 'Open confirmed records',
    icon: Icons.event_available_rounded,
    filter: (event) => event.event == 'booking_confirmed',
    empty: 'No confirmed booking events have been tracked yet.',
  ),
  _MetricConfig(
    key: 'exercise-views',
    title: 'Exercise views',
    subtitle: 'Open view records',
    icon: Icons.fitness_center_rounded,
    filter:
        (event) =>
            event.event == 'library_view' ||
            (event.event == 'page_view' && event.path.startsWith('/exercises')),
    empty: 'No exercise views have been tracked yet.',
  ),
  _MetricConfig(
    key: 'saved-exercises',
    title: 'Saved exercises',
    subtitle: 'Open saved records',
    icon: Icons.bookmark_added_rounded,
    filter: (event) => event.event == 'exercise_plan_saved',
    empty: 'No saved exercise events have been tracked yet.',
  ),
  _MetricConfig(
    key: 'chat-leads',
    title: 'Chat leads',
    subtitle: 'Open lead records',
    icon: Icons.chat_bubble_outline_rounded,
    filter:
        (event) =>
            event.event == 'chat_message_sent' ||
            event.event == 'chat_booking_intent',
    empty: 'No chat leads have been tracked yet.',
  ),
  _MetricConfig(
    key: 'countries',
    title: 'Countries captured',
    subtitle: 'Open country records',
    icon: Icons.public_rounded,
    filter: (event) => event.country != 'Country not captured',
    empty: 'No country data has been captured yet.',
  ),
];

class AdminGrowthScreen extends StatelessWidget {
  const AdminGrowthScreen({super.key});

  bool _isPatientEvent(_GrowthEvent event) {
    final source = '${event.params['source'] ?? ''}';
    return !event.path.startsWith('/admin') &&
        !event.path.startsWith('/codex-') &&
        source != 'smoke_test';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Growth tracking')),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream:
            FirebaseFirestore.instance
                .collection('growthEvents')
                .orderBy('createdAtIso', descending: true)
                .limit(220)
                .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(child: Text('Could not load growth tracking.'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final events =
              snapshot.data!.docs
                  .map(
                    (doc) => _GrowthEvent(
                      id: doc.id,
                      event: '${doc.data()['event'] ?? ''}',
                      path: '${doc.data()['path'] ?? '/'}',
                      raw: doc.data(),
                    ),
                  )
                  .where(_isPatientEvent)
                  .toList();

          final counts = _metricCounts(events);
          final recent = events.take(8).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Patient journey live view',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.navy,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Real-time patient activity for booking, exercise interest and chat leads.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _metrics.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.92,
                ),
                itemBuilder: (context, index) {
                  final metric = _metrics[index];
                  return _MetricCard(
                    metric: metric,
                    value: counts[metric.key] ?? 0,
                    primary: index == 0,
                    onTap:
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder:
                                (_) => _AdminGrowthDetailScreen(
                                  metric: metric,
                                  events: events,
                                ),
                          ),
                        ),
                  );
                },
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Recent activity',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Latest patient-side events across the website.',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (recent.isEmpty)
                        const Text(
                          'Recent patient activity will appear here once visitors browse the website.',
                          style: TextStyle(color: AppColors.textSecondary),
                        )
                      else
                        ...recent.map((event) => _RecentEventTile(event)),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Map<String, int> _metricCounts(List<_GrowthEvent> events) {
    final sessionIds =
        events
            .map((event) => event.sessionId)
            .where((id) => id.isNotEmpty)
            .toSet();
    final countrySessions = <String, String>{};
    for (final event in events) {
      if (event.sessionId.isEmpty) continue;
      if (event.country == 'Country not captured') continue;
      countrySessions.putIfAbsent(event.sessionId, () => event.country);
    }

    return {
      'sessions': sessionIds.length,
      'book-clicks': events.where(_metrics[1].filter).length,
      'checkout-starts': events.where(_metrics[2].filter).length,
      'confirmed': events.where(_metrics[3].filter).length,
      'exercise-views': events.where(_metrics[4].filter).length,
      'saved-exercises': events.where(_metrics[5].filter).length,
      'chat-leads': events.where(_metrics[6].filter).length,
      'countries': countrySessions.length,
    };
  }
}

class _AdminGrowthDetailScreen extends StatefulWidget {
  const _AdminGrowthDetailScreen({required this.metric, required this.events});

  final _MetricConfig metric;
  final List<_GrowthEvent> events;

  @override
  State<_AdminGrowthDetailScreen> createState() =>
      _AdminGrowthDetailScreenState();
}

class _AdminGrowthDetailScreenState extends State<_AdminGrowthDetailScreen> {
  final _searchController = TextEditingController();
  int _page = 1;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final metricEvents = widget.events.where(widget.metric.filter).toList();
    final term = _searchController.text.trim().toLowerCase();
    final filtered =
        term.isEmpty
            ? metricEvents
            : metricEvents
                .where((event) => _searchHaystack(event).contains(term))
                .toList();
    final totalPages = (filtered.length / _pageSize).ceil().clamp(1, 999);
    final currentPage = _page.clamp(1, totalPages);
    final start = (currentPage - 1) * _pageSize;
    final end = (start + _pageSize).clamp(0, filtered.length);
    final visible = filtered.sublist(start, end);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: Text(widget.metric.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Icon(widget.metric.icon, color: AppColors.teal),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.metric.title,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.metric.subtitle,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${metricEvents.length}',
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      color: AppColors.navy,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by page, exercise, country or session',
              prefixIcon: const Icon(Icons.search_rounded),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              filled: true,
              fillColor: AppColors.surface,
            ),
            onChanged: (_) => setState(() => _page = 1),
          ),
          const SizedBox(height: 12),
          if (visible.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  term.isEmpty
                      ? widget.metric.empty
                      : 'No matching records found for this search.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ),
            )
          else
            ...visible.map((event) => _GrowthEventCard(event: event)),
          if (filtered.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Showing ${start + 1}-$end of ${filtered.length}',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton.filledTonal(
                  onPressed:
                      currentPage == 1
                          ? null
                          : () => setState(() => _page = currentPage - 1),
                  icon: const Icon(Icons.chevron_left_rounded),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text('$currentPage/$totalPages'),
                ),
                IconButton.filledTonal(
                  onPressed:
                      currentPage == totalPages
                          ? null
                          : () => setState(() => _page = currentPage + 1),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _searchHaystack(_GrowthEvent event) {
    return [
      _eventLabels[event.event],
      event.event,
      _eventTitle(event),
      event.path,
      event.device,
      event.sessionId,
      event.country,
      ..._eventDetails(event),
      ...event.params.values.map((value) => '$value'),
    ].whereType<String>().join(' ').toLowerCase();
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.metric,
    required this.value,
    required this.onTap,
    required this.primary,
  });

  final _MetricConfig metric;
  final int value;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final foreground = primary ? Colors.white : AppColors.navy;
    return Material(
      color: primary ? AppColors.navy : AppColors.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: primary ? AppColors.navy : AppColors.border,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(metric.icon, color: primary ? Colors.white : AppColors.teal),
              const Spacer(),
              Text(
                metric.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: primary ? Colors.white : AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                '$value',
                style: TextStyle(
                  color: foreground,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                metric.subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: primary ? Colors.white70 : AppColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentEventTile extends StatelessWidget {
  const _RecentEventTile(this.event);

  final _GrowthEvent event;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _eventTitle(event),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.navy,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            event.path,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 3),
          Text(
            '${_time(event)} · ${event.device} · ${event.country}',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _GrowthEventCard extends StatelessWidget {
  const _GrowthEventCard({required this.event});

  final _GrowthEvent event;

  @override
  Widget build(BuildContext context) {
    final details = _eventDetails(event);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _eventLabels[event.event] ?? _formatLabel(event.event),
              style: const TextStyle(
                color: AppColors.teal,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _eventTitle(event),
              style: const TextStyle(
                color: AppColors.navy,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              event.path,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(
                children: [
                  const TextSpan(
                    text: 'Country: ',
                    style: TextStyle(
                      color: AppColors.teal,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  TextSpan(text: event.country),
                ],
              ),
              style: const TextStyle(
                color: AppColors.navy,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (details.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                details.join(' · '),
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              '${_time(event)} · ${event.device} · Session ${event.sessionId.isEmpty ? 'not captured' : event.sessionId}',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _time(_GrowthEvent event) {
  final iso = event.raw['createdAtIso'] as String?;
  if (iso != null) {
    final date = DateTime.tryParse(iso);
    if (date != null) {
      return DateFormat('d MMM, HH:mm').format(date.toLocal());
    }
  }
  final createdAt = event.raw['createdAt'];
  if (createdAt is Timestamp) {
    return DateFormat('d MMM, HH:mm').format(createdAt.toDate().toLocal());
  }
  return 'Just now';
}

String _formatLabel(String value) {
  return value
      .replaceAll('-', ' ')
      .replaceAll('_', ' ')
      .split(' ')
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _pageLabel(String path) {
  final segments = path.split('/').where((part) => part.isNotEmpty).toList();
  if (segments.isEmpty) return 'Home';
  if (segments.first == 'book') return 'Booking';
  if (segments.first == 'pricing') return 'Pricing';
  if (segments.first == 'services') {
    return segments.length > 1
        ? 'Service: ${_formatLabel(segments[1])}'
        : 'Services';
  }
  if (segments.first == 'exercises') {
    if (segments.length > 2 && segments[1] == 'area') {
      return 'Exercise area: ${_formatLabel(segments[2])}';
    }
    if (segments.length > 2 && segments[1] == 'for') {
      return 'Condition exercises: ${_formatLabel(segments[2])}';
    }
    if (segments.length > 2 && segments[1] == 'tests') {
      return 'Self-test: ${_formatLabel(segments[2])}';
    }
    if (segments.length > 1) return 'Exercise: ${_formatLabel(segments[1])}';
    return 'Exercise library';
  }
  return _formatLabel(segments.last);
}

String _eventTitle(_GrowthEvent event) {
  if (event.event == 'page_view') {
    return '${_pageLabel(event.path)} page viewed';
  }
  if (event.event == 'book_now_click') {
    final service =
        event.param('service_title').isNotEmpty
            ? event.param('service_title')
            : event.param('service_slug').isNotEmpty
            ? event.param('service_slug')
            : event.param('service');
    return service.isNotEmpty
        ? 'Booking CTA clicked: ${_formatLabel(service)}'
        : 'Booking CTA clicked';
  }
  if (event.event == 'library_view') {
    final title =
        event.param('exercise_title').isNotEmpty
            ? event.param('exercise_title')
            : event.param('exercise_slug');
    return title.isNotEmpty
        ? 'Exercise viewed: ${_formatLabel(title)}'
        : 'Exercise guide viewed';
  }
  if (event.event == 'exercise_plan_saved') {
    final title =
        event.param('exercise_title').isNotEmpty
            ? event.param('exercise_title')
            : event.param('exercise_slug');
    return title.isNotEmpty
        ? 'Exercise saved: ${_formatLabel(title)}'
        : 'Exercise saved to plan';
  }
  if (event.event == 'chat_message_sent') {
    final preview = event.param('message_preview');
    return preview.isNotEmpty
        ? 'Patient asked: $preview'
        : 'Patient chat message';
  }
  return _eventLabels[event.event] ?? _formatLabel(event.event);
}

List<String> _eventDetails(_GrowthEvent event) {
  final details = <String>[];
  final service =
      event.param('service_title').isNotEmpty
          ? event.param('service_title')
          : event.param('service_slug').isNotEmpty
          ? event.param('service_slug')
          : event.param('service');
  if (service.isNotEmpty) details.add('Service: ${_formatLabel(service)}');

  final exercise =
      event.param('exercise_title').isNotEmpty
          ? event.param('exercise_title')
          : event.param('exercise_slug');
  if (exercise.isNotEmpty) details.add('Exercise: ${_formatLabel(exercise)}');

  final step = event.param('step');
  if (step.isNotEmpty) details.add('Step: ${_formatLabel(step)}');

  final slotDate = event.param('slot_date');
  if (slotDate.isNotEmpty) details.add('Slot date: $slotDate');

  final intent = event.param('intent');
  if (intent.isNotEmpty) details.add('Intent: ${_formatLabel(intent)}');

  return details;
}
