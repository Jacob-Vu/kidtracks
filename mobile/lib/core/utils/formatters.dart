import 'package:intl/intl.dart';

String formatMoney(int amount) {
  if (amount == 0) return '0d';
  if (amount >= 1000000) {
    final whole = amount % 1000000 == 0;
    return '${(amount / 1000000).toStringAsFixed(whole ? 0 : 1)}M';
  }
  if (amount >= 1000) return '${(amount / 1000).toStringAsFixed(0)}k';
  return '${amount}d';
}

String formatMoneyFull(int amount) {
  return '${NumberFormat.decimalPattern('vi_VN').format(amount)}d';
}

