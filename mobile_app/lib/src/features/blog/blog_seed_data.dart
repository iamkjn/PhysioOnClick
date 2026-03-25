import 'blog_article.dart';

const _blogCategories = [
  'Back pain',
  'Knee injuries',
  'Shoulder rehab',
  'Sciatica',
  'Sports injuries',
  'Neurological conditions',
  'Post-surgery recovery',
  'Home exercise advice',
  'Workplace ergonomics',
];

const _topicSeeds = [
  'Morning stiffness',
  'Desk-based pain flare-ups',
  'Return to running',
  'Confidence after surgery',
  'Exercise pacing',
  'Balance and falls prevention',
  'Shoulder overhead loading',
  'Nerve-related symptoms',
  'Hip and knee strength',
  'Recovery planning',
  'Walking tolerance',
  'Home-working posture',
];

List<BlogSection> _buildSections(String category, String topic, int index) {
  return [
    BlogSection(
      heading: 'Why this matters',
      body: [
        '$topic is one of the most common concerns discussed in physiotherapy when it starts affecting walking, work, sleep or confidence with activity.',
        'For ${category.toLowerCase()}, a strong rehab plan usually starts with understanding what triggers symptoms, how they behave over a full day and what goals matter most to the patient.',
      ],
    ),
    BlogSection(
      heading: 'What treatment can involve',
      body: [
        'Evidence-based physiotherapy often combines education, exercise progression and practical pacing advice rather than relying on a quick fix.',
        'This article in the PhysioOnClick library is designed to support informed decisions and safer self-management while you decide whether to book an assessment.',
      ],
    ),
  ];
}

String _slugify(String value) {
  return value
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-|-$'), '');
}

final seededBlogArticles = List<BlogArticle>.generate(108, (index) {
  final category = _blogCategories[index % _blogCategories.length];
  final topic = _topicSeeds[index % _topicSeeds.length];
  final title = '$topic and ${category.toLowerCase()}: a practical UK physiotherapy guide';
  final slug = _slugify('$title-${index + 1}');

  return BlogArticle(
    id: slug,
    slug: slug,
    title: title,
    excerpt:
        'A clear, evidence-based guide covering symptoms, rehab planning, common mistakes and when to seek assessment.',
    category: category,
    image: '',
    publishedAt: DateTime(2025, (index % 12) + 1, (index % 28) + 1).toIso8601String(),
    sections: _buildSections(category, topic, index),
  );
});
