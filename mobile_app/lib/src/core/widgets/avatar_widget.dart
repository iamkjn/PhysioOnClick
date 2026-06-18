import 'package:flutter/material.dart';

import '../utils/avatar_utils.dart';

class AvatarWidget extends StatelessWidget {
  const AvatarWidget({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 48,
    this.onTap,
    this.showEditBadge = false,
  });

  final String name;
  final String? imageUrl;
  final double size;
  final VoidCallback? onTap;
  final bool showEditBadge;

  @override
  Widget build(BuildContext context) {
    final circle = imageUrl != null && imageUrl!.isNotEmpty
        ? CircleAvatar(
            radius: size / 2,
            backgroundImage: NetworkImage(imageUrl!),
          )
        : CircleAvatar(
            radius: size / 2,
            backgroundColor: avatarColor(name),
            child: Text(
              avatarInitials(name),
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: size * 0.38,
              ),
            ),
          );

    if (onTap == null && !showEditBadge) return circle;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          circle,
          if (showEditBadge)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: size * 0.38,
                height: size * 0.38,
                decoration: BoxDecoration(
                  color: const Color(0xFF0891B2),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Icon(Icons.camera_alt_rounded, color: Colors.white, size: size * 0.22),
              ),
            ),
        ],
      ),
    );
  }
}
