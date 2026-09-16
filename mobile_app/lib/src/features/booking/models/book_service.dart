/// Mirrors lib/site-data.ts (pricing) + lib/cal-services.ts (CAL_SERVICES)
/// on the web app. There is no JSON API for this catalogue — keep this
/// file in sync by hand whenever those two web files change.
enum BookServiceId { initialAssessment, followUp, bundle4, bundle8 }

extension BookServiceIdApi on BookServiceId {
  String get apiId => switch (this) {
        BookServiceId.initialAssessment => 'initial-assessment',
        BookServiceId.followUp => 'follow-up',
        BookServiceId.bundle4 => 'bundle-4',
        BookServiceId.bundle8 => 'bundle-8',
      };
}

class ResolvedService {
  final BookServiceId id;
  final String title;
  final String duration;
  final double price;
  final String description;
  final String mode; // "In-person" | "Online" | "Package"
  final String calSlug;
  final int minutes;
  final int sessions;
  final List<String> included;

  const ResolvedService({
    required this.id,
    required this.title,
    required this.duration,
    required this.price,
    required this.description,
    required this.mode,
    required this.calSlug,
    required this.minutes,
    required this.sessions,
    required this.included,
  });

  String get apiId => id.apiId;
}

const List<ResolvedService> _kServices = [
  ResolvedService(
    id: BookServiceId.initialAssessment,
    title: 'Initial Online Assessment',
    duration: '60 min',
    price: 50,
    description: 'Remote assessment with tailored advice and exercise planning.',
    mode: 'Online',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 1,
    included: [
      '60-minute video consultation',
      'Full movement and pain assessment',
      'Personalised exercise plan',
      'Written summary in your portal',
    ],
  ),
  ResolvedService(
    id: BookServiceId.followUp,
    title: 'Online Follow-Up',
    duration: '30 min',
    price: 40,
    description: 'Ongoing online progression and accountability support.',
    mode: 'Online',
    calSlug: 'online-follow-up',
    minutes: 30,
    sessions: 1,
    included: [
      '30-minute video consultation',
      'Progress review and plan update',
      'Adjusted exercise programme',
    ],
  ),
  ResolvedService(
    id: BookServiceId.bundle4,
    title: '4 Session Bundle',
    duration: 'Flexible',
    price: 180,
    description: 'Cost-effective package for structured rehabilitation.',
    mode: 'Package',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 4,
    included: [
      'Four sessions, booked as you go',
      'Full assessment in session one',
      'Personalised exercise plan',
      'Progress tracking in your portal',
    ],
  ),
  ResolvedService(
    id: BookServiceId.bundle8,
    title: '8 Session Bundle',
    duration: 'Flexible',
    price: 340,
    description: 'Longer-term rehabilitation plan with review milestones.',
    mode: 'Package',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 8,
    included: [
      'Eight sessions, booked as you go',
      'Full assessment in session one',
      'Personalised exercise plan',
      'Review milestones and progress tracking',
    ],
  ),
];

List<ResolvedService> allBookServices() => _kServices;

ResolvedService bookServiceFor(BookServiceId id) =>
    _kServices.firstWhere((s) => s.id == id);
