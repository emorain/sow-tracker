'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type SowImportRow = {
  ear_tag?: string;
  name?: string;
  birth_date?: string;
  breed?: string;
  status?: 'active' | 'culled' | 'sold';
  notes?: string;
  right_ear_notch?: string;
  left_ear_notch?: string;
  registration_number?: string;
};

type ValidationResult = {
  row: number;
  data: SowImportRow;
  valid: boolean;
  errors: string[];
};

type ImportResult = {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  details: Array<{ row: number; earTag: string; status: 'success' | 'failed' | 'skipped'; message?: string }>;
};

export default function ImportSowsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        ear_tag: 'SOW-001',
        name: 'Betsy',
        birth_date: '2022-01-15',
        breed: 'Yorkshire',
        status: 'active',
        right_ear_notch: '3',
        left_ear_notch: '5',
        registration_number: 'YS-12345',
        notes: 'Example sow - excellent mother'
      },
      {
        ear_tag: 'SOW-002',
        name: 'Willow',
        birth_date: '2022-03-20',
        breed: 'Landrace',
        status: 'active',
        right_ear_notch: '2',
        left_ear_notch: '4',
        registration_number: '',
        notes: ''
      },
      {
        ear_tag: '',
        name: 'Daisy',
        birth_date: '2023-06-10',
        breed: 'Duroc',
        status: 'active',
        right_ear_notch: '',
        left_ear_notch: '',
        registration_number: '',
        notes: 'Leave ear_tag blank to auto-generate'
      }
    ];

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sows');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // ear_tag
      { wch: 15 }, // name
      { wch: 12 }, // birth_date
      { wch: 12 }, // breed
      { wch: 10 }, // status
      { wch: 15 }, // right_ear_notch
      { wch: 15 }, // left_ear_notch
      { wch: 18 }, // registration_number
      { wch: 35 }  // notes
    ];

    // Download as Excel
    XLSX.writeFile(wb, 'sow-import-template.xlsx');
    toast.success('Template downloaded!');
  };

  const downloadTemplateCSV = () => {
    const templateData = [
      {
        ear_tag: 'SOW-001',
        name: 'Betsy',
        birth_date: '2022-01-15',
        breed: 'Yorkshire',
        status: 'active',
        right_ear_notch: '3',
        left_ear_notch: '5',
        registration_number: 'YS-12345',
        notes: 'Example sow - excellent mother'
      },
      {
        ear_tag: 'SOW-002',
        name: 'Willow',
        birth_date: '2022-03-20',
        breed: 'Landrace',
        status: 'active',
        right_ear_notch: '2',
        left_ear_notch: '4',
        registration_number: '',
        notes: ''
      },
      {
        ear_tag: '',
        name: 'Daisy',
        birth_date: '2023-06-10',
        breed: 'Duroc',
        status: 'active',
        right_ear_notch: '',
        left_ear_notch: '',
        registration_number: '',
        notes: 'Leave ear_tag blank to auto-generate'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sow-import-template.csv';
    link.click();
    toast.success('CSV template downloaded!');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResults([]);
      setImportResult(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    setLoading(true);
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            validateData(results.data as SowImportRow[]);
          },
          error: (error) => {
            toast.error(`CSV parsing error: ${error.message}`);
            setLoading(false);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as SowImportRow[];
        validateData(jsonData);
      } else {
        toast.error('Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(`File parsing error: ${err.message}`);
      setLoading(false);
    }
  };

  const validateData = async (data: SowImportRow[]) => {
    try {
      // Fetch existing ear tags to check for duplicates
      const { data: existingSows, error } = await supabase
        .from('sows')
        .select('ear_tag');

      if (error) throw error;

      const existingEarTags = new Set(existingSows?.map(s => s.ear_tag.toLowerCase()) || []);
      const results: ValidationResult[] = [];

      data.forEach((row, index) => {
        const errors: string[] = [];

        // Check required fields
        if (!row.birth_date) {
          errors.push('Birth date is required');
        } else {
          // Validate date format
          const date = new Date(row.birth_date);
          if (isNaN(date.getTime())) {
            errors.push('Invalid birth date format (use YYYY-MM-DD)');
          }
        }

        if (!row.breed || row.breed.trim() === '') {
          errors.push('Breed is required');
        }

        // Validate status
        if (row.status && !['active', 'culled', 'sold'].includes(row.status)) {
          errors.push('Status must be: active, culled, or sold');
        }

        // Check for duplicate ear tags (if provided)
        if (row.ear_tag && row.ear_tag.trim() !== '') {
          const earTagLower = row.ear_tag.trim().toLowerCase();
          if (existingEarTags.has(earTagLower)) {
            errors.push(`Ear tag "${row.ear_tag}" already exists in database`);
          }
          // Check for duplicates within the import file
          const duplicateInFile = results.find(r =>
            r.data.ear_tag && r.data.ear_tag.toLowerCase() === earTagLower
          );
          if (duplicateInFile) {
            errors.push(`Duplicate ear tag in file (row ${duplicateInFile.row + 1})`);
          }
        }

        // Validate ear notches are numbers
        if (row.right_ear_notch && isNaN(Number(row.right_ear_notch))) {
          errors.push('Right ear notch must be a number');
        }
        if (row.left_ear_notch && isNaN(Number(row.left_ear_notch))) {
          errors.push('Left ear notch must be a number');
        }

        results.push({
          row: index + 1,
          data: row,
          valid: errors.length === 0,
          errors
        });
      });

      setValidationResults(results);
      setLoading(false);

      const validCount = results.filter(r => r.valid).length;
      const invalidCount = results.filter(r => !r.valid).length;

      toast.success(`Validation complete: ${validCount} valid, ${invalidCount} invalid`);
    } catch (err: any) {
      toast.error(`Validation error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const validRows = validationResults.filter(r => r.valid);

    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    const result: ImportResult = {
      total: validRows.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    try {
      for (const validRow of validRows) {
        const row = validRow.data;

        try {
          // Generate ear tag if not provided
          let earTag = row.ear_tag?.trim() || '';
          if (!earTag) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            earTag = `AUTO-${date}-${random}`;
          }

          // Insert the sow
          const { error: insertError } = await supabase
            .from('sows')
            .insert([{
              ear_tag: earTag,
              name: row.name?.trim() || null,
              birth_date: row.birth_date,
              breed: row.breed?.trim() || '',
              status: row.status || 'active',
              notes: row.notes?.trim() || null,
              right_ear_notch: row.right_ear_notch ? parseInt(row.right_ear_notch) : null,
              left_ear_notch: row.left_ear_notch ? parseInt(row.left_ear_notch) : null,
              registration_number: row.registration_number?.trim() || null,
            }]);

          if (insertError) {
            // Check if it's a duplicate error (might have been added during import)
            if (insertError.code === '23505') {
              result.skipped++;
              result.details.push({
                row: validRow.row,
                earTag,
                status: 'skipped',
                message: 'Duplicate ear tag'
              });
            } else {
              throw insertError;
            }
          } else {
            result.successful++;
            result.details.push({
              row: validRow.row,
              earTag,
              status: 'success'
            });
          }
        } catch (err: any) {
          result.failed++;
          result.details.push({
            row: validRow.row,
            earTag: row.ear_tag || 'N/A',
            status: 'failed',
            message: err.message
          });
        }
      }

      setImportResult(result);

      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} sow${result.successful !== 1 ? 's' : ''}!`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} row${result.failed !== 1 ? 's' : ''}`);
      }
      if (result.skipped > 0) {
        toast.warning(`Skipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      toast.error(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Import Sows</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/sows">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sow List
            </Button>
          </Link>
        </div>

        {/* Instructions Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Import Sows from Spreadsheet</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file to import multiple sows at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Download the template file (Excel or CSV format)</li>
                <li>Fill in your sow data following the example rows</li>
                <li>Save the file and upload it below</li>
                <li>Review the validation results and import valid rows</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadTemplate} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Excel Template
              </Button>
              <Button onClick={downloadTemplateCSV} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Column Reference:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><strong>ear_tag:</strong> Unique ID (optional, auto-generated if blank)</div>
                <div><strong>name:</strong> Sow name (optional)</div>
                <div><strong>birth_date:</strong> <span className="text-red-600">Required</span> (YYYY-MM-DD)</div>
                <div><strong>breed:</strong> <span className="text-red-600">Required</span></div>
                <div><strong>status:</strong> active, culled, or sold (default: active)</div>
                <div><strong>right_ear_notch:</strong> Number (optional)</div>
                <div><strong>left_ear_notch:</strong> Number (optional)</div>
                <div><strong>registration_number:</strong> Text (optional)</div>
                <div className="sm:col-span-2"><strong>notes:</strong> Any additional information (optional)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select a CSV or Excel file (.xlsx, .xls) containing your sow data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  {file ? file.name : 'Click to select file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV, Excel (.xlsx, .xls)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setValidationResults([]);
                      setImportResult(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Results */}
        {loading && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Validating data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && validationResults.length > 0 && !importResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>
                    {validationResults.filter(r => r.valid).length} valid rows,{' '}
                    {validationResults.filter(r => !r.valid).length} invalid rows
                  </CardDescription>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing || validationResults.filter(r => r.valid).length === 0}
                >
                  {importing ? 'Importing...' : `Import ${validationResults.filter(r => r.valid).length} Sows`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {validationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.valid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.valid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">Row {result.row}</span>
                          <span className="text-sm text-gray-600">
                            {result.data.ear_tag || '(auto-generated)'} - {result.data.name || 'Unnamed'} - {result.data.breed || 'No breed'}
                          </span>
                        </div>
                        {!result.valid && (
                          <ul className="text-sm text-red-700 space-y-0.5">
                            {result.errors.map((error, i) => (
                              <li key={i}>• {error}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Import Complete</CardTitle>
              <CardDescription>
                {importResult.successful} successful, {importResult.failed} failed, {importResult.skipped} skipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importResult.details.map((detail, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        detail.status === 'success'
                          ? 'bg-green-50 text-green-800'
                          : detail.status === 'skipped'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      Row {detail.row}: {detail.earTag} - {detail.status}
                      {detail.message && ` (${detail.message})`}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push('/sows')}
                    className="flex-1"
                  >
                    View Sow List
                  </Button>
                  <Button
                    onClick={() => {
                      setFile(null);
                      setValidationResults([]);
                      setImportResult(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Import More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
