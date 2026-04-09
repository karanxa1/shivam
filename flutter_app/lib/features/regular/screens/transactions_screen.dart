import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/transaction.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Income', 'Expense'];

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final uid = authProvider.uid;

    if (uid == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: _TransactionSearchDelegate(
                  firestoreService: context.read<FirestoreService>(),
                  uid: authProvider.uid ?? '',
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(filter),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() => _selectedFilter = filter);
                    },
                    selectedColor: AppTheme.primaryYellow.withValues(
                      alpha: 0.2,
                    ),
                    checkmarkColor: AppTheme.primaryYellow,
                    labelStyle: TextStyle(
                      color: isSelected
                          ? AppTheme.primaryYellow
                          : AppTheme.darkTextSecondary,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Transactions list
          Expanded(
            child: StreamBuilder<List<Transaction>>(
              stream: firestoreService.getUserTransactions(uid),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                var transactions = snapshot.data ?? [];

                // Apply filter
                if (_selectedFilter == 'Income') {
                  transactions = transactions
                      .where((t) => t.type == TransactionType.income)
                      .toList();
                } else if (_selectedFilter == 'Expense') {
                  transactions = transactions
                      .where((t) => t.type == TransactionType.expense)
                      .toList();
                }

                // Apply search is handled via SearchDelegate (search icon in AppBar)

                if (transactions.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.receipt_long_outlined,
                          size: 64,
                          color: AppTheme.darkTextTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No transactions found',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(color: AppTheme.darkTextSecondary),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap + to add your first transaction',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppTheme.darkTextTertiary),
                        ),
                      ],
                    ),
                  );
                }

                // Group transactions by date
                final groupedTransactions = <String, List<Transaction>>{};
                for (final txn in transactions) {
                  final dateKey = Formatters.dateGroupKey(txn.date);
                  groupedTransactions.putIfAbsent(dateKey, () => []).add(txn);
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: groupedTransactions.length,
                  itemBuilder: (context, index) {
                    final date = groupedTransactions.keys.elementAt(index);
                    final dayTransactions = groupedTransactions[date]!;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            date,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(color: AppTheme.darkTextSecondary),
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: AppTheme.darkCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.darkDivider),
                          ),
                          child: ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: dayTransactions.length,
                            separatorBuilder: (_, i) =>
                                Divider(color: AppTheme.darkDivider, height: 1),
                            itemBuilder: (context, i) {
                              final txn = dayTransactions[i];
                              return _TransactionTile(
                                transaction: txn,
                                onTap: () => _showTransactionDetails(txn),
                                onDelete: () => _deleteTransaction(txn),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go(AppRouter.addTransaction),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showTransactionDetails(Transaction txn) {
    final isIncome = txn.type == TransactionType.income;

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                        (isIncome ? AppTheme.successColor : AppTheme.errorColor)
                            .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                    color: isIncome
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        txn.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        txn.category,
                        style: TextStyle(color: AppTheme.darkTextSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _DetailRow(label: 'Amount', value: Formatters.currency(txn.amount)),
            _DetailRow(label: 'Type', value: isIncome ? 'Income' : 'Expense'),
            _DetailRow(label: 'Date', value: Formatters.dateFull(txn.date)),
            if (txn.note.isNotEmpty)
              _DetailRow(label: 'Notes', value: txn.note),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteTransaction(Transaction txn) async {
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Transaction'),
        content: const Text(
          'Are you sure you want to delete this transaction?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await firestoreService.deleteTransaction(txn.id!);
      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Transaction deleted')),
        );
      }
    }
  }
}

class _TransactionTile extends StatelessWidget {
  final Transaction transaction;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _TransactionTile({
    required this.transaction,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionType.income;

    return Dismissible(
      key: Key(transaction.id ?? transaction.title),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        color: AppTheme.errorColor,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: (isIncome ? AppTheme.successColor : AppTheme.errorColor)
                .withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isIncome ? Icons.arrow_downward : Icons.arrow_upward,
            color: isIncome ? AppTheme.successColor : AppTheme.errorColor,
            size: 20,
          ),
        ),
        title: Text(
          transaction.title,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          transaction.category,
          style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 12),
        ),
        trailing: Text(
          '${isIncome ? '+' : '-'}${Formatters.currency(transaction.amount)}',
          style: TextStyle(
            color: isIncome ? AppTheme.successColor : AppTheme.errorColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(color: AppTheme.darkTextSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionSearchDelegate extends SearchDelegate<Transaction?> {
  final FirestoreService firestoreService;
  final String uid;

  _TransactionSearchDelegate({
    required this.firestoreService,
    required this.uid,
  });

  @override
  String get searchFieldLabel => 'Search transactions...';

  @override
  List<Widget> buildActions(BuildContext context) => [
    if (query.isNotEmpty)
      IconButton(icon: const Icon(Icons.clear), onPressed: () => query = ''),
  ];

  @override
  Widget buildLeading(BuildContext context) => IconButton(
    icon: const Icon(Icons.arrow_back),
    onPressed: () => close(context, null),
  );

  @override
  Widget buildResults(BuildContext context) => _buildSearchResults();

  @override
  Widget buildSuggestions(BuildContext context) => _buildSearchResults();

  Widget _buildSearchResults() {
    if (query.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search, size: 64, color: AppTheme.darkTextTertiary),
            const SizedBox(height: 16),
            Text(
              'Search by title, category or notes',
              style: TextStyle(color: AppTheme.darkTextSecondary),
            ),
          ],
        ),
      );
    }

    return StreamBuilder<List<Transaction>>(
      stream: firestoreService.getUserTransactions(uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final q = query.toLowerCase();
        final results = (snapshot.data ?? []).where((t) {
          return t.title.toLowerCase().contains(q) ||
              t.category.toLowerCase().contains(q) ||
              t.note.toLowerCase().contains(q);
        }).toList();

        if (results.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 64,
                  color: AppTheme.darkTextTertiary,
                ),
                const SizedBox(height: 16),
                Text(
                  'No results for "$query"',
                  style: TextStyle(color: AppTheme.darkTextSecondary),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: results.length,
          itemBuilder: (context, index) {
            final txn = results[index];
            final isIncome = txn.type == TransactionType.income;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.darkDivider),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color:
                        (isIncome ? AppTheme.successColor : AppTheme.errorColor)
                            .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                    color: isIncome
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                    size: 20,
                  ),
                ),
                title: Text(
                  txn.title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  '${txn.category} • ${Formatters.dateShort(txn.date)}',
                  style: TextStyle(
                    color: AppTheme.darkTextTertiary,
                    fontSize: 12,
                  ),
                ),
                trailing: Text(
                  '${isIncome ? '+' : '-'}${Formatters.currency(txn.amount)}',
                  style: TextStyle(
                    color: isIncome
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                onTap: () => close(context, txn),
              ),
            );
          },
        );
      },
    );
  }
}
