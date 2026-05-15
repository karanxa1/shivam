import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../models/transaction.dart' as txn;
import '../models/budget.dart';
import '../models/employee.dart';
import '../models/payslip.dart';
import '../models/task.dart';
import '../utils/formatters.dart';

class PdfService {
  static final PdfService _instance = PdfService._internal();
  factory PdfService() => _instance;
  PdfService._internal();

  pw.ThemeData get _theme => pw.ThemeData.withFont(
    base: pw.Font.helvetica(),
    bold: pw.Font.helveticaBold(),
  );

  // ── Color Palette ──────────────────────────────────────────────────────────
  static final PdfColor _primary = PdfColor.fromHex('2563EB'); // blue-600
  static final PdfColor _success = PdfColor.fromHex('22C55E'); // green-500
  static final PdfColor _danger = PdfColor.fromHex('EF4444'); // red-500
  static final PdfColor _warning = PdfColor.fromHex('F59E0B'); // amber-500
  static final PdfColor _purple = PdfColor.fromHex('8B5CF6'); // violet-500
  static final PdfColor _teal = PdfColor.fromHex('14B8A6'); // teal-500
  static final PdfColor _slate = PdfColor.fromHex('64748B'); // slate-500
  static final PdfColor _slateLight = PdfColor.fromHex('94A3B8'); // slate-400
  static final PdfColor _white = PdfColors.white;

  static final List<PdfColor> _chartColors = [
    _primary, _teal, _purple, _warning, _danger, _success,
    PdfColor.fromHex('3B82F6'), PdfColor.fromHex('0EA5E9'),
    PdfColor.fromHex('A855F7'), PdfColor.fromHex('F97316'),
  ];

  // ── 1. Header Widget ──────────────────────────────────────────────────────
  pw.Widget _buildHeader(String title, String subtitle) {
    return pw.Container(
      width: double.infinity,
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('F8FAFC'),
        border: pw.Border(
          top: pw.BorderSide(color: _primary, width: 3),
          bottom: pw.BorderSide(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
        ),
      ),
      child: pw.Padding(
        padding: const pw.EdgeInsets.all(16),
        child: pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.center,
          children: [
            // Logo circle
            pw.Container(
              width: 36,
              height: 36,
              decoration: pw.BoxDecoration(
                color: _primary,
                borderRadius: pw.BorderRadius.circular(18),
              ),
              child: pw.Center(
                child: pw.Text('FM', style: pw.TextStyle(color: _white, fontWeight: pw.FontWeight.bold, fontSize: 12)),
              ),
            ),
            pw.SizedBox(width: 10),
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('FinManager', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14, color: PdfColor.fromHex('1E293B'))),
                  pw.Text(title, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11, color: _primary)),
                  pw.Text(subtitle, style: pw.TextStyle(fontSize: 8, color: _slate)),
                ],
              ),
            ),
            // Date badge
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: pw.BoxDecoration(
                color: _primary,
                borderRadius: pw.BorderRadius.circular(12),
              ),
              child: pw.Text(
                'Generated: ${Formatters.date(DateTime.now())}',
                style: pw.TextStyle(color: _white, fontSize: 7, fontWeight: pw.FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  pw.Widget _buildFooter(pw.Context context) {
    return pw.Container(
      alignment: pw.Alignment.centerRight,
      margin: const pw.EdgeInsets.only(top: 8),
      padding: const pw.EdgeInsets.only(top: 6),
      decoration: const pw.BoxDecoration(
        border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300, width: 0.3)),
      ),
      child: pw.Text(
        'FinManager Enterprise Suite  ·  Page ${context.pageNumber} of ${context.pagesCount}  ·  Confidential',
        style: pw.TextStyle(fontSize: 7, color: _slateLight),
      ),
    );
  }

  // ── Summary Card ──────────────────────────────────────────────────────────
  pw.Widget _summaryCard(String label, String value, PdfColor color, String iconChar) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('F8FAFC'),
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
      ),
      child: pw.Row(
        children: [
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(label.toUpperCase(), style: pw.TextStyle(fontSize: 7, color: _slate)),
                pw.SizedBox(height: 3),
                pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11, color: PdfColor.fromHex('1E293B'))),
              ],
            ),
          ),
          pw.Container(
            width: 24,
            height: 24,
            decoration: pw.BoxDecoration(
              color: color,
              borderRadius: pw.BorderRadius.circular(12),
            ),
            child: pw.Center(
              child: pw.Text(iconChar, style: pw.TextStyle(color: _white, fontWeight: pw.FontWeight.bold, fontSize: 9)),
            ),
          ),
        ],
      ),
    );
  }

  // ── Mini Stat ─────────────────────────────────────────────────────────────
  pw.Widget _miniStat(String label, String value, PdfColor color) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(8),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('F8FAFC'),
        borderRadius: pw.BorderRadius.circular(5),
      ),
      child: pw.Column(
        children: [
          pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12, color: color)),
          pw.SizedBox(height: 2),
          pw.Text(label, style: pw.TextStyle(fontSize: 7, color: _slate)),
        ],
      ),
    );
  }

  // ── Section Header ────────────────────────────────────────────────────────
  pw.Widget _sectionHeader(String title) {
    return pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        pw.Container(width: 4, height: 12, decoration: pw.BoxDecoration(color: _primary, borderRadius: pw.BorderRadius.circular(2))),
        pw.SizedBox(width: 6),
        pw.Text(title, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11, color: PdfColor.fromHex('1E293B'))),
      ],
    );
  }

  // ── Profile Box ───────────────────────────────────────────────────────────
  pw.Widget _profileBox(String name, String line1, String line2, {String? line3}) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('F8FAFC'),
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(name, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12, color: PdfColor.fromHex('1E293B'))),
          pw.SizedBox(height: 3),
          pw.Text(line1, style: pw.TextStyle(fontSize: 8, color: _slate)),
          pw.Text(line2, style: pw.TextStyle(fontSize: 8, color: _slate)),
          if (line3 != null) pw.Text(line3, style: pw.TextStyle(fontSize: 8, color: _slate)),
        ],
      ),
    );
  }

  // ── Progress Bar ──────────────────────────────────────────────────────────
  pw.Widget _progressBar(String label, double pct, PdfColor color, String valueText) {
    final clampedPct = pct.clamp(0.0, 100.0);
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(label, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('475569'))),
            pw.Text(valueText, style: pw.TextStyle(fontSize: 7, color: _slate)),
          ],
        ),
        pw.SizedBox(height: 4),
        pw.Stack(
          children: [
            pw.Container(
              height: 8,
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('E2E8F0'),
                borderRadius: pw.BorderRadius.circular(4),
              ),
            ),
            pw.Container(
              height: 8,
              width: 280 * (clampedPct / 100),
              decoration: pw.BoxDecoration(
                color: color,
                borderRadius: pw.BorderRadius.circular(4),
              ),
            ),
            if (clampedPct > 15)
              pw.Container(
                height: 8,
                child: pw.Center(
                  child: pw.Text(
                    '${clampedPct.toStringAsFixed(0)}%',
                    style: pw.TextStyle(fontSize: 6, color: _white, fontWeight: pw.FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  // ── Bar Chart ─────────────────────────────────────────────────────────────
  pw.Widget _barChart(String title, List<MapEntry<String, int>> data) {
    if (data.isEmpty) return pw.SizedBox();
    final maxVal = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);
    if (maxVal == 0) return pw.SizedBox();

    return pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('F8FAFC'),
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(title, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9, color: PdfColor.fromHex('1E293B'))),
          pw.SizedBox(height: 10),
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: data.asMap().entries.map((entry) {
              final d = entry.value;
              final color = _chartColors[entry.key % _chartColors.length];
              final height = (d.value / maxVal) * 70;
              return pw.Expanded(
                child: pw.Column(
                  children: [
                    pw.Text(
                      d.value >= 1000 ? '${(d.value / 1000).toStringAsFixed(1)}k' : d.value.toString(),
                      style: pw.TextStyle(fontSize: 6, color: PdfColor.fromHex('1E293B'), fontWeight: pw.FontWeight.bold),
                    ),
                    pw.SizedBox(height: 3),
                    pw.Container(
                      height: height.toDouble(),
                      margin: const pw.EdgeInsets.symmetric(horizontal: 2),
                      decoration: pw.BoxDecoration(
                        color: color,
                        borderRadius: pw.BorderRadius.only(
                          topLeft: const pw.Radius.circular(3),
                          topRight: const pw.Radius.circular(3),
                        ),
                      ),
                    ),
                    pw.SizedBox(height: 3),
                    pw.Text(
                      d.key.length > 5 ? '${d.key.substring(0, 4)}..' : d.key,
                      style: pw.TextStyle(fontSize: 5, color: _slate),
                      textAlign: pw.TextAlign.center,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ── Table Style ───────────────────────────────────────────────────────────
  pw.Widget _styledTable(List<String> headers, List<List<String>> rows) {
    return pw.TableHelper.fromTextArray(
      headers: headers,
      data: rows,
      headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: _white, fontSize: 8),
      headerDecoration: pw.BoxDecoration(color: _primary),
      rowDecoration: const pw.BoxDecoration(color: PdfColors.white),
      oddRowDecoration: pw.BoxDecoration(color: PdfColor.fromHex('F8FAFC')),
      border: pw.TableBorder.all(color: PdfColor.fromHex('E2E8F0'), width: 0.5),
      cellStyle: pw.TextStyle(fontSize: 8, color: PdfColor.fromHex('334155')),
      cellPadding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    );
  }

  // ── 1. Regular User Monthly Finance Report ─────────────────────────────────
  Future<void> generateMonthlyFinanceReport(
    String userName,
    String month,
    List<txn.Transaction> transactions,
    List<Budget> budgets,
  ) async {
    final pdf = pw.Document(theme: _theme);
    final income = transactions
        .where((t) => t.type == txn.TransactionType.income)
        .fold(0.0, (s, t) => s + t.amount);
    final expenses = transactions
        .where((t) => t.type == txn.TransactionType.expense)
        .fold(0.0, (s, t) => s + t.amount);
    final savings = income - expenses;
    final savingsRate = income > 0 ? (savings / income) * 100 : 0.0;

    // Expense by category
    final expenseMap = <String, int>{};
    for (final t in transactions.where((t) => t.type == txn.TransactionType.expense)) {
      expenseMap[t.category] = (expenseMap[t.category] ?? 0) + t.amount.toInt();
    }
    final expenseData = expenseMap.entries.toList();

    // Income by category
    final incomeMap = <String, int>{};
    for (final t in transactions.where((t) => t.type == txn.TransactionType.income)) {
      incomeMap[t.category] = (incomeMap[t.category] ?? 0) + t.amount.toInt();
    }
    final incomeData = incomeMap.entries.toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        header: (context) => _buildHeader('Monthly Finance Report', '$userName · $month'),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          // Summary cards
          pw.Row(
            children: [
              pw.Expanded(child: _summaryCard('Total Income', Formatters.currency(income), _success, '+')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Total Expenses', Formatters.currency(expenses), _danger, '-')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Net Savings', Formatters.currency(savings), _primary, '=')),
            ],
          ),
          pw.SizedBox(height: 12),
          // Mini stats
          pw.Row(
            children: [
              pw.Expanded(child: _miniStat('Transactions', '${transactions.length}', _slate)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Income Txns', '${transactions.where((t) => t.type == txn.TransactionType.income).length}', _success)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Expense Txns', '${transactions.where((t) => t.type == txn.TransactionType.expense).length}', _danger)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Savings Rate', '${savingsRate.toStringAsFixed(0)}%', savingsRate >= 20 ? _success : savingsRate >= 0 ? _warning : _danger)),
            ],
          ),
          pw.SizedBox(height: 16),
          // Charts
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              if (expenseData.isNotEmpty)
                pw.Expanded(child: _barChart('Expenses by Category', expenseData)),
              if (expenseData.isNotEmpty && incomeData.isNotEmpty)
                pw.SizedBox(width: 10),
              if (incomeData.isNotEmpty)
                pw.Expanded(child: _barChart('Income Sources', incomeData)),
            ],
          ),
          pw.SizedBox(height: 16),
          // Budget section
          if (budgets.isNotEmpty) ...[
            _sectionHeader('Budget Performance'),
            pw.SizedBox(height: 8),
            ...budgets.map((b) {
              final pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0.0;
              final color = pct > 90 ? _danger : pct > 75 ? _warning : pct > 50 ? PdfColor.fromHex('60A5FA') : _success;
              return pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 12),
                child: _progressBar(
                  b.category,
                  pct,
                  color,
                  '${Formatters.currencyCompact(b.spent)} / ${Formatters.currencyCompact(b.limit)}',
                ),
              );
            }),
            pw.SizedBox(height: 12),
          ],
          // Transaction table
          _sectionHeader('Transaction Details'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Date', 'Title', 'Category', 'Type', 'Amount'],
            transactions.map((t) => [
              Formatters.dateShort(t.date),
              t.title,
              t.category,
              t.type == txn.TransactionType.income ? 'Income' : 'Expense',
              Formatters.currency(t.amount),
            ]).toList(),
          ),
        ],
      ),
    );

    await _saveAndShare(pdf, 'finance-report-$month.pdf');
  }

  // ── 2. Employee Monthly Report ────────────────────────────────────────────
  Future<void> generateEmployeeMonthlyReport(
    Employee employee,
    String month,
    Payslip? payslip,
    List<Task> tasks,
  ) async {
    final pdf = pw.Document(theme: _theme);

    final doneCount = tasks.where((t) => t.status == TaskStatus.done).length;
    final pendingCount = tasks.where((t) => t.status == TaskStatus.pending).length;
    final inProgressCount = tasks.where((t) => t.status == TaskStatus.inProgress).length;
    final completionRate = tasks.isNotEmpty ? (doneCount / tasks.length) * 100 : 0.0;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        header: (context) => _buildHeader('Employee Monthly Report', '${employee.name} · $month'),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          // Profile
          _profileBox(
            employee.name,
            '${employee.department} · ${employee.email}',
            'Base Salary: ${Formatters.currency(employee.salary)} · Overtime: ${employee.overtimeHours} hrs',
          ),
          pw.SizedBox(height: 12),
          // Salary cards
          if (payslip != null) ...[
            pw.Row(
              children: [
                pw.Expanded(child: _summaryCard('Basic Salary', Formatters.currency(payslip.basicSalary), _primary, 'B')),
                pw.SizedBox(width: 8),
                pw.Expanded(child: _summaryCard('Overtime Pay', Formatters.currency(payslip.overtimePay), _warning, 'OT')),
                pw.SizedBox(width: 8),
                pw.Expanded(child: _summaryCard('Net Pay', Formatters.currency(payslip.netPay), _success, 'NP')),
              ],
            ),
            pw.SizedBox(height: 12),
            // Salary bar chart
            _barChart('Salary Breakdown', [
              MapEntry('Basic', payslip.basicSalary.toInt()),
              MapEntry('OT Pay', payslip.overtimePay.toInt()),
              MapEntry('Deduct', payslip.deductions.toInt()),
              MapEntry('Net', payslip.netPay.toInt()),
            ]),
            pw.SizedBox(height: 16),
          ],
          // Task stats
          pw.Row(
            children: [
              pw.Expanded(child: _miniStat('Total Tasks', '${tasks.length}', _slate)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Done', '$doneCount', _success)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Pending', '$pendingCount', _warning)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('In Progress', '$inProgressCount', _primary)),
            ],
          ),
          pw.SizedBox(height: 12),
          // Completion rate highlight
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromHex('F8FAFC'),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Row(
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Completion Rate', style: pw.TextStyle(fontSize: 8, color: _slate)),
                      pw.Text('${completionRate.toStringAsFixed(0)}%', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: _primary)),
                    ],
                  ),
                ),
                pw.Container(
                  width: 50,
                  height: 50,
                  decoration: pw.BoxDecoration(
                    color: completionRate >= 80 ? _success : completionRate >= 50 ? _warning : _danger,
                    borderRadius: pw.BorderRadius.circular(25),
                  ),
                  child: pw.Center(
                    child: pw.Text('${completionRate.toStringAsFixed(0)}%', style: pw.TextStyle(color: _white, fontWeight: pw.FontWeight.bold, fontSize: 10)),
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 16),
          // Task table
          _sectionHeader('Task Details'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Task', 'Status', 'Due Date'],
            tasks.map((t) => [
              t.title,
              t.status == TaskStatus.done ? 'Completed' : t.status == TaskStatus.inProgress ? 'In Progress' : 'Pending',
              Formatters.dateShort(t.dueDate),
            ]).toList(),
          ),
        ],
      ),
    );

    await _saveAndShare(pdf, 'employee-report-${employee.name.replaceAll(' ', '-')}-$month.pdf');
  }

  // ── 3. Admin/HR Full Employee Report ──────────────────────────────────────
  Future<void> generateFullEmployeeReport(
    Employee employee,
    List<Payslip> payslips,
    List<Task> tasks,
  ) async {
    final pdf = pw.Document(theme: _theme);
    final totalEarnings = payslips.fold<double>(0, (s, p) => s + p.netPay);
    final avgMonthly = payslips.isNotEmpty ? totalEarnings / payslips.length : 0.0;
    final doneCount = tasks.where((t) => t.status == TaskStatus.done).length;
    final completionRate = tasks.isNotEmpty ? (doneCount / tasks.length) * 100 : 0.0;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        header: (context) => _buildHeader('Employee Comprehensive Report', employee.name),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          _profileBox(
            employee.name,
            '${employee.department} · ${employee.email}',
            'Base Salary: ${Formatters.currency(employee.salary)} · Overtime Hours: ${employee.overtimeHours} hrs/month',
            line3: 'Overtime Hours: ${employee.overtimeHours} hrs/month',
          ),
          pw.SizedBox(height: 12),
          // Key stats
          pw.Row(
            children: [
              pw.Expanded(child: _summaryCard('Total Earnings', Formatters.currency(totalEarnings), _success, 'E')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Avg Monthly', Formatters.currency(avgMonthly), _primary, 'M')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Completion', '${completionRate.toStringAsFixed(0)}%', completionRate >= 80 ? _success : completionRate >= 50 ? _warning : _danger, 'C')),
            ],
          ),
          pw.SizedBox(height: 12),
          // Salary trend
          if (payslips.isNotEmpty)
            _barChart(
              'Net Pay Trend',
              payslips.map((p) => MapEntry(p.month.substring(5), p.netPay.toInt())).toList(),
            ),
          pw.SizedBox(height: 12),
          // Task mini stats
          pw.Row(
            children: [
              pw.Expanded(child: _miniStat('Total Tasks', '${tasks.length}', _slate)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Completed', '$doneCount', _success)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('Pending', '${tasks.where((t) => t.status == TaskStatus.pending).length}', _warning)),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _miniStat('In Prog', '${tasks.where((t) => t.status == TaskStatus.inProgress).length}', _primary)),
            ],
          ),
          pw.SizedBox(height: 16),
          // Payslip table
          _sectionHeader('Payslip History'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Month', 'Basic', 'Overtime', 'Deductions', 'Net Pay'],
            payslips.map((p) => [
              p.month,
              Formatters.currency(p.basicSalary),
              Formatters.currency(p.overtimePay),
              Formatters.currency(p.deductions),
              Formatters.currency(p.netPay),
            ]).toList(),
          ),
          pw.SizedBox(height: 16),
          // Task table
          _sectionHeader('Task History'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Task', 'Status', 'Due Date'],
            tasks.map((t) => [
              t.title,
              t.status == TaskStatus.done ? 'Completed' : t.status == TaskStatus.inProgress ? 'In Progress' : 'Pending',
              Formatters.dateShort(t.dueDate),
            ]).toList(),
          ),
        ],
      ),
    );

    await _saveAndShare(pdf, 'full-report-${employee.name.replaceAll(' ', '-')}.pdf');
  }

  // ── 4. Task Report ────────────────────────────────────────────────────────
  Future<void> generateTaskReport(String userName, List<Task> tasks) async {
    final pdf = pw.Document(theme: _theme);
    final pending = tasks.where((t) => t.status == TaskStatus.pending).length;
    final inProgress = tasks.where((t) => t.status == TaskStatus.inProgress).length;
    final done = tasks.where((t) => t.status == TaskStatus.done).length;
    final completionRate = tasks.isNotEmpty ? (done / tasks.length) * 100 : 0.0;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        header: (context) => _buildHeader('Task Report', userName),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.Row(
            children: [
              pw.Expanded(child: _summaryCard('Total Tasks', '$pending', _slate, 'T')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Pending', '$pending', _warning, 'P')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('In Progress', '$inProgress', _primary, 'IP')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Done', '$done', _success, 'D')),
            ],
          ),
          pw.SizedBox(height: 12),
          // Completion circle
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromHex('F8FAFC'),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Row(
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Completion Rate', style: pw.TextStyle(fontSize: 9, color: _slate)),
                      pw.SizedBox(height: 4),
                      pw.Text('${completionRate.toStringAsFixed(0)}%', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: completionRate >= 80 ? _success : completionRate >= 50 ? _primary : _warning)),
                      pw.Text('$done of ${tasks.length} tasks completed', style: pw.TextStyle(fontSize: 7, color: _slate)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 16),
          _barChart('Tasks by Status', [
            MapEntry('Pending', pending),
            MapEntry('In Progress', inProgress),
            MapEntry('Done', done),
          ]),
          pw.SizedBox(height: 16),
          _sectionHeader('Task Details'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Task', 'Status', 'Due Date'],
            tasks.map((t) => [
              t.title,
              t.status == TaskStatus.done ? 'Completed' : t.status == TaskStatus.inProgress ? 'In Progress' : 'Pending',
              Formatters.dateShort(t.dueDate),
            ]).toList(),
          ),
        ],
      ),
    );

    await _saveAndShare(pdf, 'task-report-${userName.replaceAll(' ', '-')}.pdf');
  }

  // ── 5. Payslip History Report ─────────────────────────────────────────────
  Future<void> generatePayslipHistoryReport(String userName, List<Payslip> payslips) async {
    final pdf = pw.Document(theme: _theme);
    final totalEarnings = payslips.fold<double>(0, (s, p) => s + p.netPay);
    final totalBasic = payslips.fold<double>(0, (s, p) => s + p.basicSalary);
    final totalOT = payslips.fold<double>(0, (s, p) => s + p.overtimePay);

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        header: (context) => _buildHeader('Payslip History Report', userName),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.Row(
            children: [
              pw.Expanded(child: _summaryCard('Payslips', '${payslips.length}', _slate, '#')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Total Basic', Formatters.currency(totalBasic), _primary, 'B')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Total OT', Formatters.currency(totalOT), _warning, 'OT')),
              pw.SizedBox(width: 8),
              pw.Expanded(child: _summaryCard('Total Net', Formatters.currency(totalEarnings), _success, 'N')),
            ],
          ),
          pw.SizedBox(height: 16),
          if (payslips.isNotEmpty)
            _barChart(
              'Net Pay by Month',
              payslips.map((p) => MapEntry(p.month, p.netPay.toInt())).toList(),
            ),
          pw.SizedBox(height: 16),
          _sectionHeader('Payslip Details'),
          pw.SizedBox(height: 8),
          _styledTable(
            ['Month', 'Basic', 'Overtime', 'Deductions', 'Net Pay'],
            payslips.map((p) => [
              p.month,
              Formatters.currency(p.basicSalary),
              Formatters.currency(p.overtimePay),
              Formatters.currency(p.deductions),
              Formatters.currency(p.netPay),
            ]).toList(),
          ),
        ],
      ),
    );

    await _saveAndShare(pdf, 'payslip-history-${userName.replaceAll(' ', '-')}.pdf');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  Future<void> _saveAndShare(pw.Document pdf, String filename) async {
    try {
      final bytes = await pdf.save();
      if (kIsWeb) {
        await Printing.sharePdf(bytes: bytes, filename: filename);
      } else {
        final dir = await getTemporaryDirectory();
        final file = File('${dir.path}/$filename');
        await file.writeAsBytes(bytes);
        await Share.shareXFiles([XFile(file.path)], text: 'FinManager Report: $filename');
      }
    } catch (e) {
      debugPrint('PDF save error: $e');
      throw Exception('Failed to save PDF: $e');
    }
  }
}
