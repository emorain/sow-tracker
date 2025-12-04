/**
 * CSV Export Utility
 * Provides functions to convert data to CSV format and trigger downloads
 */

type CSVRow = Record<string, any>;

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (defaults to object keys)
 * @returns CSV string
 */
export function convertToCSV(data: CSVRow[], headers?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      return escapeCSVValue(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapes a value for CSV format
 * @param value Value to escape
 * @returns Escaped string
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let stringValue = String(value);

  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

/**
 * Triggers a CSV download in the browser
 * @param data Array of objects to export
 * @param filename Name of the file (without .csv extension)
 * @param headers Optional custom headers
 */
export function downloadCSV(data: CSVRow[], filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers);

  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDateForCSV(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Format datetime for CSV export
 * @param dateString ISO datetime string
 * @returns Formatted datetime string
 */
export function formatDateTimeForCSV(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
