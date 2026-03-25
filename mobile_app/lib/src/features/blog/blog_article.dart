class BlogArticle {
  const BlogArticle({
    required this.id,
    required this.slug,
    required this.title,
    required this.excerpt,
    required this.category,
    required this.image,
    required this.publishedAt,
    required this.sections,
  });

  final String id;
  final String slug;
  final String title;
  final String excerpt;
  final String category;
  final String image;
  final String publishedAt;
  final List<BlogSection> sections;

  DateTime? get publishedDate {
    if (publishedAt.isEmpty) {
      return null;
    }

    return DateTime.tryParse(publishedAt);
  }

  factory BlogArticle.fromMap(Map<String, dynamic> data, String id) {
    final rawSections = (data['sections'] as List<dynamic>? ?? const []);

    return BlogArticle(
      id: id,
      slug: '${data['slug'] ?? id}',
      title: '${data['title'] ?? 'Untitled article'}',
      excerpt: '${data['excerpt'] ?? ''}',
      category: '${data['category'] ?? 'General'}',
      image: '${data['image'] ?? ''}',
      publishedAt: '${data['publishedAt'] ?? ''}',
      sections: rawSections
          .whereType<Map<dynamic, dynamic>>()
          .map(
            (section) => BlogSection(
              heading: '${section['heading'] ?? ''}',
              body: (section['body'] as List<dynamic>? ?? const []).map((item) => '$item').toList(),
            ),
          )
          .toList(),
    );
  }
}

class BlogSection {
  const BlogSection({
    required this.heading,
    required this.body,
  });

  final String heading;
  final List<String> body;
}
