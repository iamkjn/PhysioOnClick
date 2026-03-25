import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/firebase/patient_account_service.dart';
import 'blog_article.dart';
import 'blog_seed_data.dart';

class BlogDetailScreen extends StatefulWidget {
  const BlogDetailScreen({super.key, required this.article}) : slug = null;
  const BlogDetailScreen.fromSlug({super.key, required this.slug}) : article = null;

  final BlogArticle? article;
  final String? slug;

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  Future<BlogArticle> _loadArticle() async {
    if (widget.article != null) {
      return widget.article!;
    }

    final slug = widget.slug!;
    final seededMatch = seededBlogArticles.where((article) => article.slug == slug);
    if (seededMatch.isNotEmpty) {
      return seededMatch.first;
    }

    final bySlug = await FirebaseFirestore.instance
        .collection('blogs')
        .where('slug', isEqualTo: slug)
        .limit(1)
        .get();

    if (bySlug.docs.isNotEmpty) {
      final doc = bySlug.docs.first;
      return BlogArticle.fromMap(doc.data(), doc.id);
    }

    final directDoc = await FirebaseFirestore.instance.collection('blogs').doc(slug).get();
    if (directDoc.exists) {
      return BlogArticle.fromMap(directDoc.data()!, directDoc.id);
    }

    throw StateError('Article not found');
  }

  Future<void> _shareArticle(BlogArticle article) async {
    final shareText = [
      article.title,
      'Read this article in PhysioOnClick.',
      'physioonclick://blog/${article.slug}',
      'https://physioonclick.co.uk/blog/${article.slug}',
    ].join('\n');

    await Share.share(
      shareText,
      subject: article.title,
    );
  }

  Future<void> _toggleFavourite(BuildContext context, BlogArticle article, bool isFavourite) async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to save favourite blogs.')),
      );
      return;
    }

    await PatientAccountService.ensurePatientRecord(user);
    final ref = PatientAccountService.favouriteBlogDoc(user.uid, article.slug);

    if (isFavourite) {
      await ref.delete();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Removed from favourites.')),
        );
      }
      return;
    }

    await ref.set({
      'slug': article.slug,
      'title': article.title,
      'category': article.category,
      'excerpt': article.excerpt,
      'publishedAt': article.publishedAt,
      'image': article.image,
      'savedAt': FieldValue.serverTimestamp(),
      'userId': user.uid,
      'userEmail': user.email ?? '',
    });

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved to favourites.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FutureBuilder<BlogArticle>(
      future: _loadArticle(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return Scaffold(
            appBar: AppBar(title: const Text('Article')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'We could not load this article right now.',
                  style: theme.textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final article = snapshot.data!;
        final user = FirebaseAuth.instance.currentUser;

        return StreamBuilder<bool>(
          stream: user == null
              ? Stream.value(false)
              : PatientAccountService.favouriteBlogDoc(user.uid, article.slug)
                  .snapshots()
                  .map((doc) => doc.exists),
          builder: (context, favouriteSnapshot) {
            final isFavourite = favouriteSnapshot.data ?? false;

            return Scaffold(
              appBar: AppBar(
                title: const Text('Article'),
                actions: [
                  IconButton(
                    onPressed: () => _shareArticle(article),
                    icon: const Icon(Icons.ios_share_rounded),
                    tooltip: 'Share article',
                  ),
                  IconButton(
                    onPressed: () => _toggleFavourite(context, article, isFavourite),
                    icon: Icon(
                      isFavourite ? Icons.star_rounded : Icons.star_border_rounded,
                      color: isFavourite ? const Color(0xFFE0A106) : null,
                    ),
                    tooltip: isFavourite ? 'Remove favourite' : 'Save favourite',
                  ),
                ],
              ),
              body: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF3FB),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        article.category,
                        style: const TextStyle(
                          color: Color(0xFF10233A),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(article.title, style: theme.textTheme.headlineMedium),
                  if (article.publishedAt.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(article.publishedAt, style: theme.textTheme.bodyMedium),
                  ],
                  const SizedBox(height: 14),
                  Text(article.excerpt, style: theme.textTheme.bodyLarge),
                  if (article.image.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.network(
                        article.image,
                        height: 220,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 220,
                          color: const Color(0xFFEAF3FB),
                          alignment: Alignment.center,
                          child: const Icon(Icons.article_rounded, size: 42, color: Color(0xFF2380C8)),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  ...article.sections.map(
                    (section) => Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(section.heading, style: theme.textTheme.titleLarge),
                          const SizedBox(height: 8),
                          ...section.body.map(
                            (paragraph) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Text(paragraph, style: theme.textTheme.bodyLarge),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
