import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/daily_task.dart';
import '../models/day_config.dart';
import '../models/family_collections.dart';
import '../models/kid.dart';
import '../models/ledger_entry.dart';
import '../models/task_template.dart';

class SyncRepository {
  SyncRepository(this._db);

  final FirebaseFirestore _db;

  Stream<List<T>> _streamCollection<T>(
    String familyId,
    String collection,
    T Function(Map<String, dynamic>) mapFn,
  ) {
    return _db
        .collection('families')
        .doc(familyId)
        .collection(collection)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => mapFn(doc.data())).toList());
  }

  Stream<FamilyCollections> watchFamilyCollections(String familyId) {
    return Stream.multi((controller) {
      List<Kid> kids = const [];
      List<TaskTemplate> templates = const [];
      List<DailyTask> dailyTasks = const [];
      List<DayConfig> dayConfigs = const [];
      List<LedgerEntry> ledger = const [];

      void emit() {
        controller.add(FamilyCollections(
          kids: kids,
          templates: templates,
          dailyTasks: dailyTasks,
          dayConfigs: dayConfigs,
          ledger: ledger,
        ));
      }

      final subscriptions = [
        _streamCollection(familyId, 'kids', Kid.fromMap).listen((value) {
          kids = value;
          emit();
        }),
        _streamCollection(familyId, 'templates', TaskTemplate.fromMap)
            .listen((value) {
          templates = value;
          emit();
        }),
        _streamCollection(familyId, 'dailyTasks', DailyTask.fromMap)
            .listen((value) {
          dailyTasks = value;
          emit();
        }),
        _streamCollection(familyId, 'dayConfigs', DayConfig.fromMap)
            .listen((value) {
          dayConfigs = value;
          emit();
        }),
        _streamCollection(familyId, 'ledger', LedgerEntry.fromMap).listen((value) {
          ledger = value;
          emit();
        }),
      ];

      controller.onCancel = () {
        for (final subscription in subscriptions) {
          subscription.cancel();
        }
      };
    });
  }
}

