import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/firebase/patient_account_service.dart';
import 'blog_article.dart';
import 'blog_detail_screen.dart';
import 'blog_seed_data.dart';

enum BlogSortOption {
  newest,
  oldest,
  alphabetical,
}

class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> {
  String selectedCategory = 'All';
  BlogSortOption sortOption = BlogSortOption.newest;
  bool onlyFavourites = false;

  Stream<Set<String>> _favouriteIdsStream(String? uid) {
    if (uid == null) {
      return Stream.value(<String>{});
    }

    return FirebaseFirestore.instance
        .collection('patients')
        .doc(uid)
        .collection('favoriteBlogs')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.id).toSet());
  }

  Future<void> _toggleFavourite(
    BuildContext context,
    BlogArticle article,
    bool isFavourite,
  ) async {
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

  List<BlogArticle> _visibleArticles(
    List<BlogArticle> source,
    Set<String> favouriteIds,
  ) {
    final filtered = source.where((article) {
      final categoryMatch = selectedCategory == 'All' || article.category == selectedCategory;
      final favouriteMatch = !onlyFavourites || favouriteIds.contains(article.slug);
      return categoryMatch && favouriteMatch;
    }).toList();

    switch (sortOption) {
      case BlogSortOption.newest:
        filtered.sort((a, b) {
          final aDate = a.publishedDate ?? DateTime(2000);
          final bDate = b.publishedDate ?? DateTime(2000);
          return bDate.compareTo(aDate);
        });
        break;
      case BlogSortOption.oldest:
        filtered.sort((a, b) {
          final aDate = a.publishedDate ?? DateTime(2000);
          final bDate = b.publishedDate ?? DateTime(2000);
          return aDate.compareTo(bDate);
        });
        break;
      case BlogSortOption.alphabetical:
        filtered.sort((a, b) => a.title.compareTo(b.title));
        break;
    }

    return filtered;
  }

  String _sortLabel(BlogSortOption value) {
    switch (value) {
      case BlogSortOption.newest:
        return 'Newest first';
      case BlogSortOption.oldest:
        return 'Oldest first';
      case BlogSortOption.alphabetical:
        return 'A to Z';
    }
  }

  Future<void> _pickCategory(List<String> categories) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            children: categories
                .map(
                  (category) => ListTile(
                    title: Text(category),
                    trailing: selectedCategory == category ? const Icon(Icons.check_rounded) : null,
                    onTap: () => Navigator.of(context).pop(category),
                  ),
                )
                .toList(),
          ),
        );
      },
    );

    if (selected != null) {
      setState(() => selectedCategory = selected);
    }
  }

  Future<void> _pickSort() async {
    final selected = await showModalBottomSheet<BlogSortOption>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            children: BlogSortOption.values
                .map(
                  (option) => ListTile(
                    title: Text(_sortLabel(option)),
                    trailing: sortOption == option ? const Icon(Icons.check_rounded) : null,
                    onTap: () => Navigator.of(context).pop(option),
                  ),
                )
                .toList(),
          ),
        );
      },
    );

    if (selected != null) {
      setState(() => sortOption = selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, authSnapshot) {
          final currentUser = authSnapshot.data;

          return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: FirebaseFirestore.instance.collection('blogs').limit(120).snapshots(),
            builder: (context, snapshot) {
              final liveArticles = snapshot.data?.docs
                      .map((doc) => BlogArticle.fromMap(doc.data(), doc.id))
                      .where((article) => article.title.trim().isNotEmpty)
                      .toList() ??
                  <BlogArticle>[];

              final articles = liveArticles.isNotEmpty ? liveArticles : seededBlogArticles;
              final categories = <String>{'All', ...articles.map((article) => article.category)}.toList();

              return StreamBuilder<Set<String>>(
                stream: _favouriteIdsStream(currentUser?.uid),
                builder: (context, favouriteSnapshot) {
                  final favouriteIds = favouriteSnapshot.data ?? <String>{};
                  final visible = _visibleArticles(articles, favouriteIds);

                  return ListView(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                    children: [
                      Text('Blog', style: theme.textTheme.headlineMedium),
                      const SizedBox(height: 8),
                      Text(
                        liveArticles.isNotEmpty
                            ? 'Live physiotherapy articles from Firebase.'
                            : 'Showing the built-in article library while live blog sync is unavailable.',
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _pickCategory(categories),
                              icon: const Icon(Icons.tune_rounded),
                              label: Text(selectedCategory),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _pickSort,
                              icon: const Icon(Icons.sort_rounded),
                              label: Text(_sortLabel(sortOption)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilterChip(
                            label: const Text('Saved blogs'),
                            selected: onlyFavourites,
                            onSelected: (value) => setState(() => onlyFavourites = value),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('${visible.length} articles', style: theme.textTheme.bodyMedium),
                      if (snapshot.hasError) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Live sync is currently unavailable, so the app is using the built-in blog library.',
                          style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF9C3F27)),
                        ),
                      ],
                      const SizedBox(height: 18),
                      if (visible.isEmpty)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Text(
                              onlyFavourites
                                  ? 'No favourite blogs match this filter yet.'
                                  : 'No articles found for this category yet.',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ),
                        ),
                      ...visible.map(
                        (article) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
                                      const SizedBox(width: 12),
                                      IconButton(
                                        onPressed: () => _toggleFavourite(
                                          context,
                                          article,
                                          favouriteIds.contains(article.slug),
                                        ),
                                        icon: Icon(
                                          favouriteIds.contains(article.slug)
                                              ? Icons.star_rounded
                                              : Icons.star_border_rounded,
                                          color: favouriteIds.contains(article.slug)
                                              ? const Color(0xFFE0A106)
                                              : const Color(0xFF62758F),
                                        ),
                                        tooltip: 'Save as favourite',
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    article.title,
                                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(article.excerpt, style: theme.textTheme.bodyMedium),
                                  if (article.publishedDate != null) ...[
                                    const SizedBox(height: 12),
                                    Text(
                                      '${article.publishedDate!.day}/${article.publishedDate!.month}/${article.publishedDate!.year}',
                                      style: theme.textTheme.bodyMedium,
                                    ),
                                  ],
                                  const SizedBox(height: 14),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => BlogDetailScreen(article: article),
                                        ),
                                      );
                                    },
                                    child: const Text('Read article'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
