import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReimbursementExcel = async (data, reportType, filters) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reimbursement Report');

    // Title & Header Styling
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `REIMBURSEMENT REPORT - ${reportType.replace('-', ' ').toUpperCase()}`;
    titleCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF41398B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Info Row
    worksheet.mergeCells('A2:G2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Generated on: ${new Date().toLocaleString()} | Period: ${filters.fromDate} to ${filters.toDate}`;
    infoCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // Headers
    const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Category', 'Amount', 'Status'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5C52C7' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Data Rows
    data.forEach((item, index) => {
        const rowData = [
            new Date(item.date).toLocaleDateString(),
            item.emp_id,
            item.employee_name,
            item.department_name || 'N/A',
            item.category,
            Number(item.amount),
            item.status
        ];
        const row = worksheet.addRow(rowData);

        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 6 ? 'right' : 'center' };
            if (colNumber === 6) cell.numFmt = '#,##0.00';
            cell.font = { name: 'Arial', size: 10 };
        });

        // Alternating row colors
        if (index % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            });
        }

        // Status color coding
        const statusCell = row.getCell(7);
        if (item.status === 'Approved' || item.status === 'Paid') {
            statusCell.font = { color: { argb: 'FF059669' }, bold: true, size: 10 };
        } else if (item.status === 'Rejected') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true, size: 10 };
        } else {
            statusCell.font = { color: { argb: 'FFD97706' }, bold: true, size: 10 };
        }
    });

    // Column widths
    worksheet.columns = [
        { width: 15 }, // Date
        { width: 18 }, // ID
        { width: 30 }, // Name
        { width: 22 }, // Dept
        { width: 22 }, // Category
        { width: 18 }, // Amount
        { width: 15 }  // Status
    ];

    // Summary at the bottom
    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['', '', '', '', 'TOTAL AMOUNT', totalAmount, '']);
    summaryRow.getCell(5).font = { bold: true, size: 11 };
    summaryRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    summaryRow.getCell(6).font = { bold: true, color: { argb: 'FF41398B' }, size: 12 };
    summaryRow.getCell(6).numFmt = '₹#,##0.00';
    summaryRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reimbursement_Report_${reportType}_${new Date().getTime()}.xlsx`);
};

export const generateReimbursementPDF = (data, reportType, filters) => {
    const doc = jsPDF();

    // Theme Colors
    const primaryColor = [65, 57, 139]; // #41398B

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('HRM PORTAL', 105, 18, { align: 'center', charSpace: 1 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(`REIMBURSEMENT REPORT - ${reportType.replace('-', ' ').toUpperCase()}`, 105, 28, { align: 'center' });

    // Sub-header
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 52);
    doc.text(`Report Period: ${filters.fromDate} to ${filters.toDate}`, 15, 58);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Records: ${data.length}`, 195, 52, { align: 'right' });

    // Table
    const tableHeaders = [['Date', 'Emp ID', 'Employee Name', 'Department', 'Category', 'Amount', 'Status']];
    const tableData = data.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.emp_id,
        item.employee_name,
        item.department_name || 'N/A',
        item.category,
        `Rs. ${Number(item.amount).toLocaleString()}`,
        item.status
    ]);

    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 65,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'center' },
            5: { halign: 'right', fontStyle: 'bold' },
            6: { halign: 'center' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 6) {
                const status = data.cell.raw;
                if (status === 'Approved' || status === 'Paid') {
                    data.cell.styles.textColor = [5, 150, 105]; // Green
                } else if (status === 'Rejected') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red
                } else {
                    data.cell.styles.textColor = [217, 119, 6]; // Amber
                }
            }
        }
    });

    // Summary
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 10;
    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL REIMBURSEMENT AMOUNT: Rs. ${totalAmount.toLocaleString()}`, 200, finalY, { align: 'right' });

    doc.save(`Reimbursement_Report_${reportType}_${new Date().getTime()}.pdf`);
};
