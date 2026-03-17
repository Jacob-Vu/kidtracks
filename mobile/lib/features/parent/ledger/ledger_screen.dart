import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/kid.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/session_controller.dart';

class LedgerScreen extends ConsumerStatefulWidget {
  const LedgerScreen({this.selectedKidId, super.key});

  final String? selectedKidId;

  @override
  ConsumerState<LedgerScreen> createState() => _LedgerScreenState();
}

class _LedgerScreenState extends ConsumerState<LedgerScreen> {
  String? _selectedKidId;

  @override
  void initState() {
    super.initState();
    _selectedKidId = widget.selectedKidId;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final family = ref.watch(familyCollectionsStateProvider);

    return family.when(
      data: (data) {
        final kidId = _selectedKidId ?? (data.kids.isNotEmpty ? data.kids.first.id : null);
        final kid = data.kids.where((item) => item.id == kidId).firstOrNull;
        final entries = data.ledger
            .where((item) => item.kidId == kidId)
            .toList()
          ..sort((a, b) => b.id.compareTo(a.id));
        final totalEarned = entries
            .where((entry) => entry.amount > 0)
            .fold<int>(0, (sum, item) => sum + item.amount);
        final totalPenalties = entries
            .where((entry) => entry.amount < 0)
            .fold<int>(0, (sum, item) => sum + item.amount);

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.t('ledger'),
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                FilledButton.icon(
                  onPressed: kid == null ? null : () => _openManualDialog(kid),
                  icon: const Icon(Icons.add_card),
                  label: Text(l10n.t('manualTransaction')),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (data.kids.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: kidId,
                items: data.kids
                    .map((kid) => DropdownMenuItem(
                          value: kid.id,
                          child: Text('${kid.avatar} ${kid.label}'),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedKidId = value),
                decoration: const InputDecoration(labelText: 'Kid'),
              ),
            const SizedBox(height: 12),
            if (kid != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _LedgerStat(title: 'Balance', value: formatMoney(kid.balance)),
                      _LedgerStat(title: 'Earned', value: '+${formatMoney(totalEarned)}'),
                      _LedgerStat(title: 'Penalty', value: formatMoney(totalPenalties)),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 12),
            if (entries.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No transactions yet'),
                ),
              )
            else
              ...entries.map(
                (entry) => Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor:
                          entry.amount >= 0 ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                      child: Icon(
                        entry.amount >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
                        color: entry.amount >= 0 ? Colors.green : Colors.red,
                      ),
                    ),
                    title: Text(entry.label),
                    subtitle: Text(
                      DateFormat.yMMMd().format(DateTime.parse(entry.date)),
                    ),
                    trailing: Text(
                      '${entry.amount >= 0 ? '+' : ''}${formatMoney(entry.amount)}',
                    ),
                  ),
                ),
              ),
          ],
        );
      },
      error: (error, _) => Center(child: Text(error.toString())),
      loading: () => Center(child: Text(l10n.t('loading'))),
    );
  }

  Future<void> _openManualDialog(Kid kid) async {
    final amount = TextEditingController();
    final label = TextEditingController();
    bool isDeduction = false;
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setLocalState) => AlertDialog(
          title: Text(context.l10n.t('manualTransaction')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SwitchListTile(
                value: isDeduction,
                onChanged: (value) => setLocalState(() => isDeduction = value),
                title: const Text('Deduction'),
              ),
              TextField(
                controller: amount,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: context.l10n.t('amount')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: label,
                decoration: InputDecoration(labelText: context.l10n.t('label')),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(context.l10n.t('cancel')),
            ),
            FilledButton(
              onPressed: () async {
                final value = (int.tryParse(amount.text) ?? 0) * 1000;
                final result = ref.read(actionsRepositoryProvider).buildManualTransaction(
                      kid,
                      isDeduction ? -value : value,
                      label.text,
                    );
                final familyId =
                    ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
                await ref.read(actionsRepositoryProvider).call('addManualTransaction', {
                  'familyId': familyId,
                  'updatedKid': result!.updatedKid.toMap(),
                  'entry': result.entry.toMap(),
                });
                if (mounted) Navigator.of(context).pop();
              },
              child: Text(context.l10n.t('save')),
            ),
          ],
        ),
      ),
    );
    amount.dispose();
    label.dispose();
  }
}

class _LedgerStat extends StatelessWidget {
  const _LedgerStat({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(title),
        const SizedBox(height: 6),
        Text(value, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
