import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ComplianceData = {
  sow_ear_tag: string;
  sow_name: string | null;
  is_compliant: boolean;
  confinement_hours_24h: number;
  confinement_hours_30d: number;
  current_housing: string | null;
  floor_space: number | null;
};

type LocationHistoryEntry = {
  housing_unit_name: string;
  moved_in_date: string;
  moved_out_date: string | null;
  reason: string | null;
  notes: string | null;
};

export async function generateIndividualCompliancePDF(
  sowData: ComplianceData,
  locationHistory: LocationHistoryEntry[],
  farmName: string,
  farmMapUrl?: string | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIFORNIA PROPOSITION 12', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.text('COMPLIANCE AUDIT TRAIL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Farm info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Farm: ${farmName}`, 20, yPos);
  yPos += 7;
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, yPos);
  yPos += 12;

  // Sow Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Sow Information', 20, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ear Tag: ${sowData.sow_ear_tag}`, 20, yPos);
  yPos += 6;
  if (sowData.sow_name) {
    doc.text(`Name: ${sowData.sow_name}`, 20, yPos);
    yPos += 6;
  }

  // Compliance Status - Color coded
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  if (sowData.is_compliant) {
    doc.setTextColor(0, 128, 0); // Green
    doc.text('Compliance Status: COMPLIANT ✓', 20, yPos);
  } else {
    doc.setTextColor(255, 0, 0); // Red
    doc.text('Compliance Status: NON-COMPLIANT ✗', 20, yPos);
  }
  doc.setTextColor(0, 0, 0); // Reset to black
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Current Housing: ${sowData.current_housing || 'Not Assigned'}`, 20, yPos);
  yPos += 6;
  doc.text(`Floor Space: ${sowData.floor_space ? sowData.floor_space + ' sq ft' : 'Not Specified'}`, 20, yPos);
  yPos += 12;

  // Confinement Hours Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Confinement Hours', 20, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const hours24Color = sowData.confinement_hours_24h > 6 ? [255, 0, 0] : [0, 128, 0];
  doc.setTextColor(hours24Color[0], hours24Color[1], hours24Color[2]);
  doc.text(`Last 24 hours: ${sowData.confinement_hours_24h.toFixed(2)} hours (Limit: 6 hours)`, 20, yPos);

  yPos += 6;
  const hours30Color = sowData.confinement_hours_30d > 24 ? [255, 0, 0] : [0, 128, 0];
  doc.setTextColor(hours30Color[0], hours30Color[1], hours30Color[2]);
  doc.text(`Last 30 days: ${sowData.confinement_hours_30d.toFixed(2)} hours (Limit: 24 hours)`, 20, yPos);
  doc.setTextColor(0, 0, 0); // Reset to black
  yPos += 12;

  // Farm Map if available
  if (farmMapUrl) {
    try {
      // Add farm map image
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Farm Layout', 20, yPos);
      yPos += 5;

      const img = await loadImage(farmMapUrl);
      const imgWidth = 170;
      const imgHeight = (img.height / img.width) * imgWidth;

      // Check if we need a new page
      if (yPos + imgHeight > 280) {
        doc.addPage();
        yPos = 20;
      }

      doc.addImage(img.src, 'JPEG', 20, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (error) {
      console.error('Failed to load farm map:', error);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('(Farm map unavailable)', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }
  }

  // Location History Table
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Location History (${locationHistory.length} entries)`, 20, yPos);
  yPos += 8;

  const tableData = locationHistory.map((entry, idx) => {
    const movedIn = new Date(entry.moved_in_date);
    const movedOut = entry.moved_out_date ? new Date(entry.moved_out_date) : null;
    const duration = movedOut
      ? Math.floor((movedOut.getTime() - movedIn.getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((new Date().getTime() - movedIn.getTime()) / (1000 * 60 * 60 * 24));

    return [
      (idx + 1).toString(),
      entry.housing_unit_name,
      movedIn.toLocaleDateString() + ' ' + movedIn.toLocaleTimeString(),
      movedOut ? movedOut.toLocaleDateString() + ' ' + movedOut.toLocaleTimeString() : 'Current',
      `${duration} days`,
      entry.reason || 'N/A',
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Housing Unit', 'Moved In', 'Moved Out', 'Duration', 'Reason']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [220, 53, 69] }, // Red theme
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 20 },
      5: { cellWidth: 35 },
    },
  });

  // Footer - Compliance Statement
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(64, 64, 64);

  const statement = 'This report satisfies California Proposition 12 record-keeping requirements for a 2-year audit trail.';
  const splitStatement = doc.splitTextToSize(statement, pageWidth - 40);
  doc.text(splitStatement, 20, finalY);

  return doc;
}

export async function generateFarmWideCompliancePDF(
  sowsData: ComplianceData[],
  farmName: string,
  farmMapUrl?: string | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIFORNIA PROPOSITION 12', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.text('FARM-WIDE COMPLIANCE SUMMARY', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Farm info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Farm: ${farmName}`, 20, yPos);
  yPos += 7;
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, yPos);
  yPos += 12;

  // Summary Statistics
  const totalSows = sowsData.length;
  const compliantSows = sowsData.filter(s => s.is_compliant).length;
  const nonCompliantSows = totalSows - compliantSows;
  const complianceRate = totalSows > 0 ? ((compliantSows / totalSows) * 100).toFixed(1) : '0';
  const atRiskSows = sowsData.filter(s =>
    s.confinement_hours_24h > 4 || s.confinement_hours_30d > 20 || !s.floor_space
  ).length;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Breeding Sows: ${totalSows}`, 20, yPos);
  yPos += 7;

  doc.setTextColor(0, 128, 0);
  doc.text(`Compliant: ${compliantSows} (${complianceRate}%)`, 20, yPos);
  yPos += 7;

  doc.setTextColor(255, 0, 0);
  doc.text(`Non-Compliant: ${nonCompliantSows}`, 20, yPos);
  yPos += 7;

  doc.setTextColor(255, 165, 0);
  doc.text(`At Risk: ${atRiskSows}`, 20, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  // Farm Map if available
  if (farmMapUrl) {
    try {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Farm Layout', 20, yPos);
      yPos += 5;

      const img = await loadImage(farmMapUrl);
      const imgWidth = 170;
      const imgHeight = (img.height / img.width) * imgWidth;

      if (yPos + imgHeight > 280) {
        doc.addPage();
        yPos = 20;
      }

      doc.addImage(img.src, 'JPEG', 20, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (error) {
      console.error('Failed to load farm map:', error);
    }
  }

  // Sow Details Table
  if (yPos > 150) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Individual Sow Compliance', 20, yPos);
  yPos += 8;

  const tableData = sowsData.map(sow => [
    sow.sow_ear_tag,
    sow.sow_name || '-',
    sow.is_compliant ? 'Yes' : 'No',
    sow.confinement_hours_24h.toFixed(1),
    sow.confinement_hours_30d.toFixed(1),
    sow.current_housing || 'None',
    sow.floor_space ? `${sow.floor_space} sq ft` : 'Not specified',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Ear Tag', 'Name', 'Compliant', '24h Hours', '30d Hours', 'Housing', 'Floor Space']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [220, 53, 69] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
    },
    didParseCell: (data) => {
      // Color code compliance column
      if (data.column.index === 2 && data.section === 'body') {
        if (data.cell.raw === 'Yes') {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [255, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(64, 64, 64);

  const statement = 'This report satisfies California Proposition 12 record-keeping requirements for farm-wide compliance verification.';
  const splitStatement = doc.splitTextToSize(statement, pageWidth - 40);
  doc.text(splitStatement, 20, finalY);

  return doc;
}

// Helper function to load image as base64
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
