import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Transaction, Budget, Employee, Payslip, Task, Project } from '@/types';
import { formatCurrency, formatDateShort, formatMonthYear, formatStatus } from './formatters';

// ── Color Palette ───────────────────────────────────────────────────────────
const C = {
  primary: [37, 99, 235] as [number, number, number],
  primaryLight: [96, 165, 250] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  teal: [20, 184, 166] as [number, number, number],
  rose: [244, 63, 94] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  amber: [251, 191, 36] as [number, number, number],
  gray100: [243, 244, 246] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray600: [75, 85, 99] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const CHART_COLORS: [number, number, number][] = [
  C.primary, C.teal, C.purple, C.warning, C.rose, C.success,
  [59, 130, 246], [14, 165, 233], [168, 85, 247], [249, 115, 22],
];

// ── Header ──────────────────────────────────────────────────────────────────
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.width;
  
  // Top accent bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, w, 3, 'F');
  
  // Header background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 3, w, 48, 'F');
  
  // Header bottom border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(0, 51, w, 51);
  
  // Icon placeholder (circle)
  doc.setFillColor(37, 99, 235);
  doc.circle(22, 23, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FM', 22, 26, { align: 'center' });
  
  // Company name
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FinManager', 36, 20);
  
  // Report title
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(13);
  doc.text(title, 36, 32);
  
  // Subtitle
  if (subtitle) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 36, 41);
  }
  
  // Date badge
  doc.setFillColor(37, 99, 235);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.roundedRect(w - 80, 14, 66, 18, 9, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Generated: ${dateStr}`, w - 47, 25, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.width;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, doc.internal.pageSize.height - 18, w - 14, doc.internal.pageSize.height - 18);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`FinManager Enterprise Suite  ·  Page ${i} of ${pageCount}  ·  Confidential`, 14, doc.internal.pageSize.height - 10);
  }
}

// ── Summary Card Box ────────────────────────────────────────────────────────
function drawSummaryCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, color: [number, number, number], iconChar: string
) {
  // Card background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 6, 6, 'F');
  
  // Left accent stripe
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, 4, h, 6, 6, 'F');
  doc.rect(x + 2, y, 4, h, 'F');
  
  // Icon circle
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x + w - 18, y + h / 2, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(iconChar, x + w - 18, y + h / 2 + 3, { align: 'center' });
  
  // Label
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), x + 14, y + 14);
  
  // Value
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 14, y + 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
}

// ── Section Header ──────────────────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, x: number, y: number, title: string) {
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(x, y, 4, 14, 2, 2, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + 10, y + 10);
  doc.setFont('helvetica', 'normal');
}

// ── Bar Chart (improved) ────────────────────────────────────────────────────
function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title: string,
  maxValue?: number
) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1) * 1.15;
  const chartPad = 8;
  const chartW = w - chartPad * 2;
  const chartH = h - 36;
  const barW = data.length > 0 ? (chartW - 20) / data.length : 0;

  // Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x, y - 2);
  doc.setFont('helvetica', 'normal');

  // Background card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 6, 6, 'F');

  // Chart area background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x + chartPad, y + 18, chartW, chartH, 4, 4, 'F');

  // Grid lines (horizontal)
  doc.setDrawColor(241, 245, 249);
  for (let i = 0; i <= 4; i++) {
    const gy = y + 22 + (chartH - 16) * (i / 4);
    doc.line(x + chartPad + 4, gy, x + chartPad + chartW - 4, gy);
  }

  // Bars
  data.forEach((d, i) => {
    const barHeight = max > 0 ? (d.value / max) * (chartH - 20) : 0;
    const bx = x + chartPad + 12 + i * barW;
    const by = y + 22 + (chartH - 16) - barHeight;
    const bw = barW - 10;
    const color = d.color || C.primary;

    if (barHeight > 0) {
      // Bar with rounded top
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(bx, by, bw, barHeight, 3, 3, 'F');
      // Fill bottom to ensure full bar
      doc.rect(bx, by + barHeight - 4, bw, 4, 'F');

      // Value label on top
      if (barHeight > 8) {
        doc.setFontSize(6);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        const valText = d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : String(d.value);
        doc.text(valText, bx + bw / 2, by - 2, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      }
    }

    // X label
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const label = d.label.length > 7 ? d.label.substring(0, 6) + '..' : d.label;
    doc.text(label, bx + bw / 2, y + chartH + 12, { align: 'center' });
  });

  // Y-axis labels
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  for (let i = 0; i <= 4; i++) {
    const val = Math.round(max * (1 - i / 4));
    const gy = y + 22 + (chartH - 16) * (i / 4);
    const txt = val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val);
    doc.text(txt, x + chartPad - 1, gy + 2);
  }
}

// ── Pie/Donut Chart (improved) ──────────────────────────────────────────────
function drawPieChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title: string
) {
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, cx, cy - r - 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  // Background card
  const cardW = r * 2 + 80;
  const cardH = r * 2 + 30;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(cx - cardW / 2 - 5, cy - r - 22, cardW + 10, cardH, 6, 6, 'F');

  let startAngle = -Math.PI / 2;

  data.forEach(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);

    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * angle;
      const a2 = startAngle + ((i + 1) / steps) * angle;
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
    }
    startAngle += angle;
  });

  // Center hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r * 0.45, 'F');

  // Center text
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Total', cx, cy - 3, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(total), cx, cy + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Legend on right
  const legendX = cx + r + 12;
  let ly = cy - r + 5;
  data.forEach((d, i) => {
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.roundedRect(legendX, ly + i * 14, 8, 8, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const pct = ((d.value / total) * 100).toFixed(0);
    const lbl = d.label.length > 10 ? d.label.substring(0, 9) + '..' : d.label;
    doc.text(`${lbl}  ${pct}%`, legendX + 14, ly + i * 14 + 6);
  });
}

// ── Horizontal Progress Bar (improved) ──────────────────────────────────────
function drawProgressBar(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  pct: number, color: [number, number, number], label?: string, value?: string
) {
  // Background track
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');

  // Filled portion
  if (pct > 0) {
    const fillW = Math.min(w * (pct / 100), w);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, fillW, h, h / 2, h / 2, 'F');
    // Ensure full fill for the inner rect
    if (fillW > h) {
      doc.rect(x + h / 2, y, fillW - h, h, 'F');
    }
  }

  // Label above
  if (label) {
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y - 3);
    doc.setFont('helvetica', 'normal');
  }

  // Percentage text (inside bar if wide enough, else outside)
  doc.setFontSize(6);
  if (pct > 40) {
    doc.setTextColor(255, 255, 255);
    doc.text(`${pct.toFixed(0)}%`, x + 6, y + h - 2);
  } else if (pct > 5) {
    doc.setTextColor(255, 255, 255);
    doc.text(`${pct.toFixed(0)}%`, x + 3, y + h - 2);
  } else {
    doc.setTextColor(71, 85, 105);
    doc.text(`${pct.toFixed(0)}%`, x + w + 3, y + h - 2);
  }

  // Value text on right
  if (value) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(value, x + w + 2, y + h - 2);
  }
}

// ── Mini Stat Box ───────────────────────────────────────────────────────────
function drawMiniStat(doc: jsPDF, x: number, y: number, label: string, value: string, color: [number, number, number]) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, 42, 30, 5, 5, 'F');
  
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 21, y + 14, { align: 'center' });
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + 21, y + 24, { align: 'center' });
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTED REPORT GENERATORS
// ═════════════════════════════════════════════════════════════════════════════
// EXPORTED REPORT GENERATORS
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. Regular User Monthly Finance Report ──────────────────────────────────
export async function generateMonthlyFinanceReport(
  userName: string,
  month: string,
  transactions: Transaction[],
  budgets: Budget[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Monthly Finance Report', `${userName}   ·   ${formatMonthYear(month)}`);

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Summary cards row
  drawSummaryCard(doc, 14, 58, 58, 38, 'Total Income', formatCurrency(income), C.success, '+');
  drawSummaryCard(doc, 76, 58, 58, 38, 'Total Expenses', formatCurrency(expenses), C.danger, '-');
  drawSummaryCard(doc, 138, 58, 58, 38, 'Net Savings', formatCurrency(savings), C.primary, '=');

  // Mini stats row
  drawMiniStat(doc, 14, 100, 'Transactions', `${transactions.length}`, C.slate);
  drawMiniStat(doc, 60, 100, 'Income Txns', `${transactions.filter(t => t.type === 'income').length}`, C.success);
  drawMiniStat(doc, 106, 100, 'Expense Txns', `${transactions.filter(t => t.type === 'expense').length}`, C.danger);
  drawMiniStat(doc, 152, 100, 'Savings Rate', `${savingsRate.toFixed(0)}%`, savingsRate >= 20 ? C.success : savingsRate >= 0 ? C.warning : C.danger);

  // Expense by category bar chart
  const expenseByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const expenseChartData = Object.entries(expenseByCategory).map(([label, value], i) => ({
    label,
    value: Math.round(value),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (expenseChartData.length > 0) {
    drawBarChart(doc, 14, 140, 100, 68, expenseChartData, 'Expenses by Category');
  }

  // Income by category bar chart
  const incomeByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'income').forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
  });
  const incomeChartData = Object.entries(incomeByCategory).map(([label, value], i) => ({
    label,
    value: Math.round(value),
    color: CHART_COLORS[(i + 3) % CHART_COLORS.length],
  }));

  if (incomeChartData.length > 0) {
    drawBarChart(doc, 120, 140, 76, 68, incomeChartData, 'Income Sources');
  }

  // Budget section
  let sectionY = 220;
  if (budgets.length > 0) {
    drawSectionHeader(doc, 14, sectionY, 'Budget Performance');
    sectionY += 16;
    budgets.forEach((b, i) => {
      const pct = Math.min(100, (b.spent / b.limit) * 100);
      const color = pct > 90 ? C.danger : pct > 75 ? C.warning : pct > 50 ? C.primaryLight : C.success;
      drawProgressBar(
        doc, 14, sectionY + i * 22, 90, 8, pct, color,
        b.category, `${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}`
      );
    });
    sectionY += budgets.length * 22 + 8;
  }

  // Transactions table
  if (sectionY > 240) { doc.addPage(); sectionY = 20; }
  drawSectionHeader(doc, 14, sectionY, 'Transaction Details');

  autoTable(doc, {
    startY: sectionY + 12,
    head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
    body: transactions.map(t => [
      formatDateShort(t.date),
      t.title,
      t.category,
      t.type === 'income' ? 'Income' : 'Expense',
      formatCurrency(t.amount),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 28 },
      4: { halign: 'right', cellWidth: 32 },
    },
  });

  addFooter(doc);
  doc.save(`finance-report-${month}.pdf`);
}

// ── 2. Employee Monthly Report ──────────────────────────────────────────────
export async function generateEmployeeMonthlyReport(
  employee: Employee,
  month: string,
  payslip: Payslip | null,
  tasks: Task[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Employee Monthly Report', `${employee.name}   ·   ${employee.department}   ·   ${formatMonthYear(month)}`);

  // Profile card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 58, 182, 36, 6, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(employee.name, 22, 72);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.department}  ·  ${employee.email}`, 22, 80);
  doc.text(`Base Salary: ${formatCurrency(employee.salary)}  ·  Overtime: ${employee.overtimeHours} hrs`, 22, 86);

  // Salary summary cards
  if (payslip) {
    drawSummaryCard(doc, 14, 100, 55, 36, 'Basic Salary', formatCurrency(payslip.basicSalary), C.primary, 'B');
    drawSummaryCard(doc, 73, 100, 55, 36, 'Overtime Pay', formatCurrency(payslip.overtimePay), C.warning, 'OT');
    drawSummaryCard(doc, 132, 100, 64, 36, 'Net Pay', formatCurrency(payslip.netPay), C.success, 'NP');

    // Salary breakdown chart
    const salaryData = [
      { label: 'Basic', value: Math.round(payslip.basicSalary), color: C.primary },
      { label: 'OT Pay', value: Math.round(payslip.overtimePay), color: C.warning },
      { label: 'Deduct', value: Math.round(payslip.deductions), color: C.danger },
      { label: 'Net', value: Math.round(payslip.netPay), color: C.success },
    ];
    drawBarChart(doc, 14, 144, 90, 60, salaryData, 'Salary Breakdown');
  }

  // Task summary
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;
  const completionRate = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  drawMiniStat(doc, 112, 144, 'Total Tasks', `${tasks.length}`, C.slate);
  drawMiniStat(doc, 158, 144, 'Done', `${doneCount}`, C.success);
  drawMiniStat(doc, 112, 180, 'Pending', `${pendingCount}`, C.warning);
  drawMiniStat(doc, 158, 180, 'In Progress', `${inProgressCount}`, C.primary);

  // Task status donut
  const taskPieData = [
    { label: 'Pending', value: pendingCount, color: C.warning },
    { label: 'In Progress', value: inProgressCount, color: C.primary },
    { label: 'Done', value: doneCount, color: C.success },
  ].filter(d => d.value > 0);

  if (taskPieData.length > 0) {
    drawPieChart(doc, 148, 160, 20, taskPieData, 'Task Status');
  }

  // Completion rate highlight
  if (completionRate > 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(112, 210, 84, 28, 5, 5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${completionRate.toFixed(0)}%`, 154, 226, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Completion Rate', 154, 234, { align: 'center' });
  }

  // Tasks table
  let tableY = 245;
  if (tableY > 240) { doc.addPage(); tableY = 20; }
  drawSectionHeader(doc, 14, tableY, 'Task Details');

  autoTable(doc, {
    startY: tableY + 12,
    head: [['Task', 'Status', 'Due Date']],
    body: tasks.map(t => [
      t.title,
      t.status === 'done' ? 'Completed' : t.status === 'inProgress' ? 'In Progress' : 'Pending',
      formatDateShort(t.dueDate),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
  });

  addFooter(doc);
  doc.save(`employee-report-${employee.name.replace(/\s+/g, '-').toLowerCase()}-${month}.pdf`);
}

// ── 3. Admin/HR Full Employee Report ────────────────────────────────────────
export async function generateFullEmployeeReport(
  employee: Employee,
  payslips: Payslip[],
  tasks: Task[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Employee Comprehensive Report', `${employee.name}   ·   ${employee.department}`);

  // Profile card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 58, 182, 40, 6, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(employee.name, 22, 74);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.department}  ·  ${employee.email}`, 22, 82);
  doc.text(`Base Salary: ${formatCurrency(employee.salary)}  ·  Overtime Hours: ${employee.overtimeHours} hrs/month`, 22, 88);
  doc.text(`Created: ${employee.createdAt ? formatDateShort(employee.createdAt) : 'N/A'}`, 22, 94);

  // Key stats
  const totalEarned = payslips.reduce((s, p) => s + p.netPay, 0);
  const avgMonthly = payslips.length > 0 ? totalEarned / payslips.length : 0;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  drawSummaryCard(doc, 14, 104, 55, 36, 'Total Earnings', formatCurrency(totalEarned), C.success, 'E');
  drawSummaryCard(doc, 73, 104, 55, 36, 'Avg Monthly', formatCurrency(avgMonthly), C.primary, 'M');
  drawSummaryCard(doc, 132, 104, 64, 36, 'Completion', `${completionRate.toFixed(0)}%`, completionRate >= 80 ? C.success : completionRate >= 50 ? C.warning : C.danger, 'C');

  // Salary trend chart
  if (payslips.length > 0) {
    const sorted = [...payslips].sort((a, b) => a.month.localeCompare(b.month));
    const trendData = sorted.map((p, i) => ({
      label: p.month.slice(5),
      value: Math.round(p.netPay),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    drawBarChart(doc, 14, 148, 100, 58, trendData, 'Net Pay Trend');
  }

  // Task stats
  drawMiniStat(doc, 122, 148, 'Total Tasks', `${tasks.length}`, C.slate);
  drawMiniStat(doc, 168, 148, 'Completed', `${doneCount}`, C.success);
  drawMiniStat(doc, 122, 184, 'Pending', `${tasks.filter(t => t.status === 'pending').length}`, C.warning);
  drawMiniStat(doc, 168, 184, 'In Prog', `${tasks.filter(t => t.status === 'inProgress').length}`, C.primary);

  // Payslip table
  let y = 216;
  drawSectionHeader(doc, 14, y, 'Payslip History');

  autoTable(doc, {
    startY: y + 12,
    head: [['Month', 'Basic Salary', 'Overtime', 'Deductions', 'Net Pay']],
    body: payslips.map(p => [
      formatMonthYear(p.month),
      formatCurrency(p.basicSalary),
      formatCurrency(p.overtimePay),
      formatCurrency(p.deductions),
      formatCurrency(p.netPay),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
    columnStyles: { 4: { halign: 'right' } },
  });

  // Task table on new page if needed
  const finalY = (doc as any).lastAutoTable?.finalY || 250;
  if (finalY > 240) {
    doc.addPage();
    y = 20;
  } else {
    y = finalY + 16;
  }
  drawSectionHeader(doc, 14, y, 'Task History');

  autoTable(doc, {
    startY: y + 12,
    head: [['Task', 'Status', 'Due Date']],
    body: tasks.map(t => [
      t.title,
      t.status === 'done' ? 'Completed' : t.status === 'inProgress' ? 'In Progress' : 'Pending',
      formatDateShort(t.dueDate),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
  });

  addFooter(doc);
  doc.save(`full-report-${employee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// ── 4. Monthly Payroll Report ───────────────────────────────────────────────
export async function generateMonthlyPayrollReport(
  month: string,
  employees: Employee[],
  payslips: Payslip[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Monthly Payroll Report', formatMonthYear(month));

  const empMap = new Map(employees.map(e => [e.id, e]));

  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const totalBasic = payslips.reduce((s, p) => s + p.basicSalary, 0);
  const totalOT = payslips.reduce((s, p) => s + p.overtimePay, 0);
  const totalDeductions = payslips.reduce((s, p) => s + p.deductions, 0);
  const avgNet = payslips.length > 0 ? totalNet / payslips.length : 0;

  // Summary cards
  drawSummaryCard(doc, 14, 58, 42, 38, 'Net Payout', formatCurrency(totalNet), C.success, 'N');
  drawSummaryCard(doc, 60, 58, 42, 38, 'Total Basic', formatCurrency(totalBasic), C.primary, 'B');
  drawSummaryCard(doc, 106, 58, 42, 38, 'Overtime', formatCurrency(totalOT), C.warning, 'OT');
  drawSummaryCard(doc, 152, 58, 44, 38, 'Deductions', formatCurrency(totalDeductions), C.danger, 'D');

  // Mini stats
  drawMiniStat(doc, 14, 102, 'Employees', `${payslips.length}`, C.slate);
  drawMiniStat(doc, 60, 102, 'Avg Net', formatCurrency(avgNet), C.primary);
  drawMiniStat(doc, 106, 102, 'Departments', `${new Set(payslips.map(p => empMap.get(p.employeeId)?.department).filter(Boolean)).size}`, C.purple);
  drawMiniStat(doc, 152, 102, 'Highest Net', formatCurrency(Math.max(...payslips.map(p => p.netPay), 0)), C.teal);

  // Department breakdown chart
  const deptBreakdown: Record<string, number> = {};
  payslips.forEach(p => {
    const dept = empMap.get(p.employeeId)?.department || 'Other';
    deptBreakdown[dept] = (deptBreakdown[dept] || 0) + p.netPay;
  });
  const deptData = Object.entries(deptBreakdown).map(([label, value], i) => ({
    label,
    value: Math.round(value),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  if (deptData.length > 0) {
    drawBarChart(doc, 14, 140, 100, 60, deptData, 'Payroll by Department');
  }

  // Pay distribution donut
  const payPieData = payslips.slice(0, 6).map((p, i) => ({
    label: empMap.get(p.employeeId)?.name?.substring(0, 10) || 'Unknown',
    value: Math.round(p.netPay),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  if (payPieData.length > 0) {
    drawPieChart(doc, 148, 160, 20, payPieData, 'Pay Distribution');
  }

  // Employee payroll table
  let y = 210;
  drawSectionHeader(doc, 14, y, 'Employee Payroll Details');

  autoTable(doc, {
    startY: y + 12,
    head: [['Employee', 'Department', 'Basic', 'Overtime', 'Deductions', 'Net Pay']],
    body: payslips.map(p => {
      const emp = empMap.get(p.employeeId);
      return [
        emp?.name || 'Unknown',
        emp?.department || '-',
        formatCurrency(p.basicSalary),
        formatCurrency(p.overtimePay),
        formatCurrency(p.deductions),
        formatCurrency(p.netPay),
      ];
    }),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
    columnStyles: { 5: { halign: 'right' } },
  });

  addFooter(doc);
  doc.save(`payroll-report-${month}.pdf`);
}

// ── 5. Project Report ───────────────────────────────────────────────────────
export async function generateProjectReport(
  project: Project,
  tasks: Task[],
  employees: Employee[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Project Report', project.title);

  const empMap = new Map(employees.map(e => [e.id, e]));

  const isOverdue = project.deadline.toDate() < new Date() && project.status !== 'completed';

  // Project info card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 58, 182, 40, 6, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(project.title, 22, 74);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${formatStatus(project.status)}  ·  Deadline: ${formatDateShort(project.deadline)}${isOverdue ? ' (OVERDUE)' : ''}`, 22, 82);
  doc.text(`Team: ${project.assignedEmployeeIds.length} members  ·  Tasks: ${tasks.length}`, 22, 88);
  if (project.description) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Description: ${project.description.substring(0, 90)}${project.description.length > 90 ? '...' : ''}`, 22, 94);
  }

  // Progress card
  const progressColor = project.kpiPercent >= 100 ? C.success : project.kpiPercent >= 60 ? C.primary : project.kpiPercent >= 30 ? C.warning : C.danger;
  drawSummaryCard(doc, 14, 104, 55, 36, 'Progress', `${project.kpiPercent}%`, progressColor, 'P');
  drawSummaryCard(doc, 73, 104, 55, 36, 'Tasks', `${tasks.length}`, C.slate, 'T');
  const doneCount = tasks.filter(t => t.status === 'done').length;
  drawSummaryCard(doc, 132, 104, 64, 36, 'Completed', `${doneCount}`, C.success, 'D');

  // Progress bar
  drawProgressBar(doc, 14, 148, 100, 10, project.kpiPercent, progressColor, 'Overall Completion');

  // Task status donut
  const taskStatusCounts: Record<string, number> = { Pending: 0, 'In Progress': 0, Done: 0 };
  tasks.forEach(t => {
    const label = t.status === 'pending' ? 'Pending' : t.status === 'inProgress' ? 'In Progress' : 'Done';
    taskStatusCounts[label]++;
  });
  const taskPieData = [
    { label: 'Pending', value: taskStatusCounts['Pending'], color: C.warning },
    { label: 'In Progress', value: taskStatusCounts['In Progress'], color: C.primary },
    { label: 'Done', value: taskStatusCounts['Done'], color: C.success },
  ].filter(d => d.value > 0);

  if (taskPieData.length > 0) {
    drawPieChart(doc, 140, 160, 22, taskPieData, 'Task Status');
  }

  // Mini task stats
  drawMiniStat(doc, 14, 168, 'Pending', `${taskStatusCounts['Pending']}`, C.warning);
  drawMiniStat(doc, 60, 168, 'In Prog', `${taskStatusCounts['In Progress']}`, C.primary);
  drawMiniStat(doc, 106, 168, 'Done', `${taskStatusCounts['Done']}`, C.success);

  // Team table
  let y = 210;
  drawSectionHeader(doc, 14, y, 'Team Members');

  autoTable(doc, {
    startY: y + 12,
    head: [['Name', 'Department']],
    body: project.assignedEmployeeIds.map(id => [
      empMap.get(id)?.name || 'Unknown',
      empMap.get(id)?.department || '-',
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
  });

  // Tasks table
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  if (finalY > 240) { doc.addPage(); y = 20; } else { y = finalY + 16; }
  drawSectionHeader(doc, 14, y, 'Task Details');

  autoTable(doc, {
    startY: y + 12,
    head: [['Task', 'Assigned To', 'Status', 'Due Date']],
    body: tasks.map(t => [
      t.title,
      empMap.get(t.employeeId)?.name || 'Unknown',
      t.status === 'done' ? 'Completed' : t.status === 'inProgress' ? 'In Progress' : 'Pending',
      formatDateShort(t.dueDate),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
  });

  addFooter(doc);
  doc.save(`project-report-${project.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// ── 6. Company Overall Report (multi-month) ─────────────────────────────────
export async function generateCompanyOverallReport(
  employees: Employee[],
  payslips: Payslip[]
) {
  const doc = new jsPDF();
  addHeader(doc, 'Company Overall Report', 'Multi-Month Payroll Overview');

  const empMap = new Map(employees.map(e => [e.id, e]));

  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const totalDeductions = payslips.reduce((s, p) => s + p.deductions, 0);
  const uniqueMonths = [...new Set(payslips.map(p => p.month))].sort();
  const avgMonthly = uniqueMonths.length > 0 ? totalNet / uniqueMonths.length : 0;
  const avgEmployeesPerMonth = uniqueMonths.length > 0 ? payslips.length / uniqueMonths.length : 0;

  // Big summary cards
  drawSummaryCard(doc, 14, 58, 55, 38, 'Total Disbursed', formatCurrency(totalNet), C.success, 'T');
  drawSummaryCard(doc, 73, 58, 55, 38, 'Months Covered', `${uniqueMonths.length}`, C.primary, 'M');
  drawSummaryCard(doc, 132, 58, 64, 38, 'Avg Monthly', formatCurrency(avgMonthly), C.teal, 'A');

  // Secondary stats
  drawMiniStat(doc, 14, 102, 'Employees', `${employees.length}`, C.slate);
  drawMiniStat(doc, 60, 102, 'Total Payslips', `${payslips.length}`, C.purple);
  drawMiniStat(doc, 106, 102, 'Avg / Month', `${avgEmployeesPerMonth.toFixed(1)}`, C.primary);
  drawMiniStat(doc, 152, 102, 'Deductions', formatCurrency(totalDeductions), C.danger);

  // Monthly trend chart
  const monthlyData = uniqueMonths.map(m => {
    const monthPayslips = payslips.filter(p => p.month === m);
    return {
      label: m.slice(5),
      value: Math.round(monthPayslips.reduce((s, p) => s + p.netPay, 0)),
      color: C.primary,
    };
  });
  if (monthlyData.length > 0) {
    drawBarChart(doc, 14, 140, 100, 58, monthlyData, 'Monthly Net Pay Trend');
  }

  // Department pie chart
  const deptBreakdown: Record<string, number> = {};
  payslips.forEach(p => {
    const dept = empMap.get(p.employeeId)?.department || 'Other';
    deptBreakdown[dept] = (deptBreakdown[dept] || 0) + p.netPay;
  });
  const deptData = Object.entries(deptBreakdown).map(([label, value], i) => ({
    label,
    value: Math.round(value),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  if (deptData.length > 0) {
    drawPieChart(doc, 148, 160, 20, deptData, 'Cost by Dept');
  }

  // Month summary table
  let y = 210;
  drawSectionHeader(doc, 14, y, 'Month-by-Month Summary');

  autoTable(doc, {
    startY: y + 12,
    head: [['Month', 'Payslips', 'Basic', 'Overtime', 'Deductions', 'Net Pay']],
    body: uniqueMonths.map(m => {
      const monthPayslips = payslips.filter(p => p.month === m);
      return [
        formatMonthYear(m),
        String(monthPayslips.length),
        formatCurrency(monthPayslips.reduce((s, p) => s + p.basicSalary, 0)),
        formatCurrency(monthPayslips.reduce((s, p) => s + p.overtimePay, 0)),
        formatCurrency(monthPayslips.reduce((s, p) => s + p.deductions, 0)),
        formatCurrency(monthPayslips.reduce((s, p) => s + p.netPay, 0)),
      ];
    }),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
    columnStyles: { 5: { halign: 'right' } },
  });

  // Employee earnings ranking
  const finalY = (doc as any).lastAutoTable?.finalY || 250;
  if (finalY > 240) { doc.addPage(); y = 20; } else { y = finalY + 16; }
  drawSectionHeader(doc, 14, y, 'Employee Total Earnings (Ranked)');

  const employeeEarnings = employees.map(e => {
    const empPayslips = payslips.filter(p => p.employeeId === e.id);
    return {
      name: e.name,
      dept: e.department,
      count: empPayslips.length,
      total: empPayslips.reduce((s, p) => s + p.netPay, 0),
    };
  }).filter(e => e.count > 0).sort((a, b) => b.total - a.total);

  autoTable(doc, {
    startY: y + 12,
    head: [['#', 'Employee', 'Department', 'Payslips', 'Total Earnings']],
    body: employeeEarnings.map((e, i) => [
      `${i + 1}`,
      e.name,
      e.dept,
      String(e.count),
      formatCurrency(e.total),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 4 },
    theme: 'grid',
    columnStyles: { 4: { halign: 'right' } },
  });

  addFooter(doc);
  doc.save(`company-overall-report.pdf`);
}

// ── 7. Capture HTML element as image (for UI charts) ────────────────────────
export async function captureElementToPDF(
  element: HTMLElement,
  doc: jsPDF,
  x: number,
  y: number,
  w: number
) {
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const aspect = canvas.height / canvas.width;
  doc.addImage(imgData, 'PNG', x, y, w, w * aspect);
}

// ── CSV Export Helper ───────────────────────────────────────────────────────
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
