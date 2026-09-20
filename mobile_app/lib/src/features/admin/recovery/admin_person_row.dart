/// Mirrors web's `PersonRow` (`components/admin-patients-list.tsx`) — a
/// flattened row for either a primary account holder or one of their
/// dependents, so both show up together in one searchable, filterable list.
class AdminPersonRow {
  const AdminPersonRow({
    required this.key,
    required this.kind,
    required this.ownerUid,
    required this.personId,
    required this.name,
    this.email = '',
    this.relationship,
    this.ownerName,
    this.ownerEmail,
  });

  final String key;

  /// `'primary'` or `'dependent'`.
  final String kind;

  /// The account holder's uid — always the `patients/{uid}` owner, even for
  /// a dependent row (dependents are scoped under their owner's data).
  final String ownerUid;

  /// The id to pass as `personId` when opening the recovery panel — the
  /// owner's own uid for a primary row, or the dependent's doc id.
  final String personId;

  final String name;
  final String email;
  final String? relationship;
  final String? ownerName;
  final String? ownerEmail;

  bool matches(String query) {
    if (query.isEmpty) return true;
    final q = query.toLowerCase();
    return name.toLowerCase().contains(q) ||
        email.toLowerCase().contains(q) ||
        (relationship ?? '').toLowerCase().contains(q) ||
        (ownerName ?? '').toLowerCase().contains(q) ||
        (ownerEmail ?? '').toLowerCase().contains(q);
  }
}
