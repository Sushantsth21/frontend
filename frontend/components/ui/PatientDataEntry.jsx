'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, Loader2, Download, X, User, Activity, Image, FolderOpen } from 'lucide-react';

const PatientDataEntry = () => {
  const [selectedPdf, setSelectedPdf] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(null);

  // Configuration
  const title = "Form Entry System";
  const description = "Select a PDF form and process it with pre-extracted medical data.";
  const endpoint = "/api/v1/form-entry";
  const bgGradient = "bg-gradient-to-r from-green-500 to-teal-500";
  const accentColor = "bg-green-500";

  // Available PDF forms in the local forms directory
  const availablePdfs = [
    'Animal Health Diseases Form.doc',
    'Application Form for Accreditation of Hospital.pdf',
    'Basic Medical Claim Form.doc',
    'Cashless Request Form.pdf',
    'Certificate Form for Cause of Death.pdf',
    'Claim Form for Health Insurance Policies.pdf',
    'Evaluation Form for Hospital.pdf',
    'Form for Renewal of Hospital Circumstances.pdf',
    'Form of Application for Medical Claims.pdf',
    'Health Insurance Claim Form.pdf',
    'Health Insurance Medical Claim Form.pdf',
    'Health Insurance Policy Claim Form.pdf',
    'Hospital Admission Form.pdf',
    'Hospital Application Form.pdf',
    'Hospital Claim Form.pdf',
    'Hospital Declaration Form.pdf',
    'Hospital Discharge Summary Form.pdf',
    'Hospital On-boarding Form.pdf',
    'Hospital Pre-Authorisation Form.pdf',
    'Hospital Referral Form.pdf',
    'Hospital Treatment Form for Insurance.pdf',
    'Medical Certification Form of Cause of Death.pdf',
    'Medical Claim Form.pdf',
    'Medical Registration cum Admission Form.pdf',
    'cam-3.pdf',
    'cam.pdf',
    'death.pdf'
  ];

  // Use environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load the cam-3_result.json data on component mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const response = await fetch('/cam-3_result.json');
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        console.error('Failed to load form data:', err);
        setError('Failed to load pre-extracted form data.');
      }
    };
    
    loadFormData();
  }, []);

  // Check if API URL is configured
  if (!API_BASE_URL) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not set. Please check your .env file.');
  }

  const processForm = async () => {
    if (!selectedPdf || !formData) {
      setError('Please select a PDF and ensure form data is loaded.');
      return;
    }

    // Check if API URL is configured
    if (!API_BASE_URL) {
      setError('API URL is not configured. Please check your environment variables.');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      // Get the PDF file from the forms directory
      const pdfPath = `/forms/${selectedPdf}`;
      
      // Fetch the PDF file
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to load PDF: ${selectedPdf}`);
      }
      
      const pdfBlob = await pdfResponse.blob();
      
      // Create FormData with the PDF and extracted data
      const formDataToSend = new FormData();
      formDataToSend.append('file', pdfBlob, selectedPdf);
      formDataToSend.append('extracted_data', JSON.stringify(formData.medical_information));
      
      console.log(`Processing form: ${selectedPdf} with API: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Processing failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add result
      setResults(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        pdfName: selectedPdf,
        data: result,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('Processing error:', err);
      
      let errorMessage = err.message;
      
      // Handle specific error types
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorMessage = `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}`;
      } else if (err.message.includes('Load failed')) {
        errorMessage = `Server error: Unable to process the form. Please try again or contact support.`;
      }
      
      setError(`Failed to process ${selectedPdf}: ${errorMessage}`);
    }
    
    setProcessing(false);
  };

  const downloadResult = (result) => {
    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.pdfName.split('.')[0]}_result.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadImage = (result) => {
    if (result.data.pdf_data) {
      // Convert base64 to blob for PDF
      const byteCharacters = atob(result.data.pdf_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.pdf_filename || `${result.pdfName.split('.')[0]}_completed_form.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (result.data.image_data) {
      // Fallback for legacy image data
      const byteCharacters = atob(result.data.image_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.image_filename || `${result.pdfName.split('.')[0]}_completed_form.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setSelectedPdf('');
    setResults([]);
    setError('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 min-h-[700px] hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col h-full">
        {/* Section Header */}
        <div className="text-center mb-8 relative">
          <div className={`absolute inset-0 ${bgGradient} opacity-5 rounded-3xl blur-3xl`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 ${bgGradient} rounded-2xl shadow-lg mr-3`}>
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            </div>
            {selectedPdf && (
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border">
                <Activity className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">
                  Selected: {selectedPdf}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PDF Selection Area */}
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-600" />
              Select PDF Form
            </h3>
            {formData && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Form data loaded
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {availablePdfs.map((pdf) => (
              <button
                key={pdf}
                onClick={() => setSelectedPdf(pdf)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-sm ${
                  selectedPdf === pdf
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${selectedPdf === pdf ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium truncate">{pdf}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              {selectedPdf ? `Selected: ${selectedPdf}` : 'Please select a PDF form to process'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm"
              >
                Clear All
              </button>
              <button
                onClick={processForm}
                disabled={processing || !selectedPdf || !formData}
                className={`${bgGradient} hover:shadow-md disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2`}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Process Form
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-1 bg-red-100 rounded-lg mr-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* File List - Remove this section since we're not uploading files */}
        {/* This section has been removed as we're now using PDF selection */}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 flex-1 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Results ({results.length})
              </h3>
              <button
                onClick={() => setResults([])}
                className="text-slate-400 hover:text-slate-600 text-sm transition-colors hover:bg-slate-100 px-3 py-1 rounded-lg"
              >
                Clear Results
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.fileId}
                  className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-slate-800 font-semibold">{result.pdfName}</h4>
                      <p className="text-slate-500 text-sm">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Show PDF/image download button for form-entry results */}
                      {(result.data.pdf_data || result.data.image_data) ? (
                        <button
                          onClick={() => downloadImage(result)}
                          className={`flex items-center gap-2 ${bgGradient} hover:shadow-md text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 font-medium`}
                        >
                          {result.data.pdf_data ? <FileText className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                          Download {result.data.pdf_data ? 'PDF' : 'Image'}
                        </button>
                      ) : (
                        /* Show JSON download button only for non-PDF/image results */
                        <button
                          onClick={() => downloadResult(result)}
                          className={`flex items-center gap-2 ${bgGradient} hover:shadow-md text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 font-medium`}
                        >
                          <Download className="h-4 w-4" />
                          Download JSON
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Only show JSON preview if there's no PDF or image data */}
                  {!(result.data.pdf_data || result.data.image_data) && (
                    <div className="bg-slate-50 rounded-xl p-4 max-h-40 overflow-y-auto border border-slate-100">
                      <pre className="text-slate-600 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {/* Show success message for form-entry results */}
                  {(result.data.pdf_data || result.data.image_data) && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Form completed successfully!</span>
                      </div>
                      <p className="text-emerald-600 text-sm mt-1">
                        Your completed form is ready for download. Click the "Download {result.data.pdf_data ? 'PDF' : 'Image'}" button above to save the filled form.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedPdf && results.length === 0 && (
          <div className="text-center py-16 flex-1 flex flex-col justify-center">
            <div className={`mx-auto w-20 h-20 ${bgGradient} rounded-3xl flex items-center justify-center shadow-lg mb-6 opacity-20`}>
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No PDF selected</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              Select a PDF form from the list above to process it with pre-extracted medical data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDataEntry;