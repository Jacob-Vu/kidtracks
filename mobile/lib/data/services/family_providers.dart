import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/family_collections.dart';
import 'actions_repository.dart';
import 'session_controller.dart';
import 'sync_repository.dart';

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  return SyncRepository(FirebaseFirestore.instance);
});

final actionsRepositoryProvider = Provider<ActionsRepository>((ref) {
  return ActionsRepository(ActionsRepository.buildDefault());
});

final familyCollectionsProvider = StreamProvider<FamilyCollections>((ref) {
  final session = ref.watch(sessionControllerProvider).valueOrNull;
  final familyId = session?.profile?.familyId;
  if (familyId == null || familyId.isEmpty) {
    return Stream.value(const FamilyCollections());
  }
  return ref.read(syncRepositoryProvider).watchFamilyCollections(familyId);
});

final familyCollectionsStateProvider =
    Provider<AsyncValue<FamilyCollections>>((ref) {
  return ref.watch(familyCollectionsProvider);
});
