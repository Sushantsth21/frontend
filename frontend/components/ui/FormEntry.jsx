'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, X, ClipboardList, Plus, Activity, Image, FolderOpen } from 'lucide-react';

const FormEntry = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState('');
  const [formData, setFormData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Configuration
  const title = "Form Entry";
  const description = "Select a PDF form and process it with pre-extracted medical data, or upload your own documents.";
  const endpoint = "/api/v1/form-entry";
  const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const bgGradient = "bg-gradient-to-r from-emerald-500 to-teal-500";
  const accentColor = "bg-emerald-500";

  // Available PDF forms in the local forms directory
  const availablePdfs = [
    'Application Form for Accreditation of Hospital.pdf',
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
    'Hospital Organ Carry out Registration Form.pdf',
    'Hospital Pre-Authorisation Form.pdf',
    'Hospital Referral Form.pdf',
    'Hospital Treatment Form for Insurance.pdf',
    'Medical Certification Form of Cause of Death.pdf',
    'Medical Claim Form.pdf',
    'Medical Registration cum Admission Form.pdf',
    'Medical Treatment Certificate Form.pdf',
    'Mediclaim Policy Form.pdf',
    'New Cashless Hospitalsation Form.pdf',
    'Private Hospital Empanelment Form.pdf',
    'Private Patient Hospital Claim Form.pdf',
    'Reimbursement Claim Form.pdf',
    'cam-3.pdf',
    'cam.pdf',
    'death.pdf',
    'survey_hospital.pdf'
  ];

  // Use environment variable - this should be set in .env.local
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if API URL is configured and log for debugging
  if (!API_BASE_URL) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not set. Please check your .env file.');
  } else {
    console.log('API_BASE_URL loaded from environment:', API_BASE_URL);
  }

  // Load the cam-3_result.json data on component mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        console.log('Attempting to load cam-3_result.json...');
        const response = await fetch('/cam-3_result.json');
        console.log('cam-3_result.json fetch response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Failed to load cam-3_result.json: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('cam-3_result.json loaded successfully. Keys:', Object.keys(data));
        setFormData(data);
      } catch (err) {
        console.error('Failed to load form data:', err);
        setError(`Failed to load pre-extracted form data: ${err.message}`);
      }
    };
    
    loadFormData();
  }, []);

  const testApiConnection = async () => {
    if (!API_BASE_URL) {
      setError('API URL is not configured. Please check your environment variables.');
      return;
    }

    setTestingConnection(true);
    setError('');

    try {
      console.log('Testing API connection to:', API_BASE_URL);
      
      // Try the actual form-entry endpoint with a HEAD request to test connectivity
      // This should return quickly without processing anything
      const testResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('API test response:', testResponse.status, testResponse.statusText);
      
      if (testResponse.ok || testResponse.status === 405) {
        // 405 Method Not Allowed is actually good - it means the endpoint exists but doesn't accept HEAD
        setError('✅ API connection successful! Server is reachable and the endpoint exists.');
      } else if (testResponse.status === 404) {
        setError(`⚠️ API endpoint not found (404). Check if ${endpoint} is the correct endpoint path.`);
      } else {
        setError(`⚠️ API server responded with status ${testResponse.status}. The server is reachable but may have issues.`);
      }
    } catch (err) {
      console.error('API connection test failed:', err);
      
      let errorMsg = '❌ API connection failed: ';
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorMsg += 'Cannot reach the server. This could be due to:\n• CORS policy blocking the request\n• Network connectivity issues\n• Server is down\n• Incorrect API URL';
      } else if (err.name === 'AbortError') {
        errorMsg += 'Connection timeout. Server may be slow or unresponsive.';
      } else {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
    }
    
    setTestingConnection(false);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
    const validFiles = newFiles.filter(file => {
      return acceptedTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== newFiles.length) {
      setError(`Some files were rejected. ${title} supports ${acceptedTypes.join(', ')} files under 10MB.`);
    } else {
      setError('');
    }

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResults(prev => prev.filter(r => r.fileId !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    // Check if API URL is configured
    if (!API_BASE_URL) {
      setError('API URL is not configured. Please check your environment variables.');
      return;
    }

    setUploading(true);
    setError('');
    
    for (const fileObj of files) {
      if (fileObj.status !== 'pending') continue;

      try {
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading' } : f
        ));

        const formData = new FormData();
        formData.append('file', fileObj.file);
        
        console.log(`Uploading to: ${API_BASE_URL}${endpoint}`);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(120000), // 2 minute timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          console.error('Response status:', response.status, response.statusText);
          
          // Try to parse error text as JSON for more details
          let serverError = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            serverError = errorJson.message || errorJson.detail || errorText;
          } catch (e) {
            // If not JSON, use the raw text
          }
          
          throw new Error(`Server Error (${response.status}): ${serverError}`);
        }

        const result = await response.json();
        
        // Update file status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'completed' } : f
        ));

        // Add result
        setResults(prev => [...prev, {
          fileId: fileObj.id,
          fileName: fileObj.file.name,
          data: result,
          timestamp: new Date().toISOString()
        }]);

      } catch (err) {
        console.error('Upload error:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        let errorMessage = err.message;
        
        // Handle specific error types
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}`;
        } else if (err.name === 'AbortError') {
          errorMessage = `Request timeout: The server took too long to respond. Please try again.`;
        } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          errorMessage = `Network error: Unable to reach the server at ${API_BASE_URL}`;
        }
        // Remove the generic "Load failed" handling to show actual server errors
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error', error: errorMessage } : f
        ));
        setError(`Failed to process ${fileObj.file.name}: ${errorMessage}`);
      }
    }
    
    setUploading(false);
  };

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
    
    // First, let's try to verify if the forms directory is accessible
    console.log('Current window location:', window.location.origin);
    console.log('Attempting to process PDF:', selectedPdf);
    console.log('API URL:', API_BASE_URL);
    
    try {
      // Get the PDF file from the forms directory
      const pdfPath = `/forms/${selectedPdf}`;
      
      console.log(`Attempting to fetch PDF from: ${pdfPath}`);
      
      // Fetch the PDF file
      const pdfResponse = await fetch(pdfPath);
      console.log(`PDF fetch response status: ${pdfResponse.status} ${pdfResponse.statusText}`);
      
      if (!pdfResponse.ok) {
        if (pdfResponse.status === 404) {
          throw new Error(`PDF file not found: ${selectedPdf}. The file may not exist in the forms directory on the server.`);
        } else {
          throw new Error(`Failed to load PDF: ${selectedPdf} (Status: ${pdfResponse.status} ${pdfResponse.statusText})`);
        }
      }
      
      const pdfBlob = await pdfResponse.blob();
      console.log(`PDF loaded successfully. Size: ${pdfBlob.size} bytes, Type: ${pdfBlob.type}`);
      
      if (pdfBlob.size === 0) {
        throw new Error(`PDF file is empty: ${selectedPdf}`);
      }
      
      if (!pdfBlob.type || !pdfBlob.type.includes('pdf')) {
        console.warn(`Warning: PDF file may not be a valid PDF. Type: ${pdfBlob.type}`);
      }
      
      // Create FormData with the PDF and extracted data
      const formDataToSend = new FormData();
      formDataToSend.append('file', pdfBlob, selectedPdf);
      
      // Verify medical_information exists
      if (!formData.medical_information) {
        console.error('Medical information not found in form data. Available keys:', Object.keys(formData));
        throw new Error('Medical information not found in the loaded form data.');
      }
      
      const extractedDataJson = JSON.stringify(formData.medical_information);
      formDataToSend.append('extracted_data', extractedDataJson);
      
      console.log(`Processing form: ${selectedPdf} with API: ${API_BASE_URL}${endpoint}`);
      console.log('PDF blob size:', pdfBlob.size);
      console.log('Extracted data size:', extractedDataJson.length);
      console.log('Medical info keys:', Object.keys(formData.medical_information));
      console.log('Form data keys:', Array.from(formDataToSend.keys()));
      
      // Log the actual request being made
      console.log('Making API request with:');
      console.log('- URL:', `${API_BASE_URL}${endpoint}`);
      console.log('- Method: POST');
      console.log('- Body: FormData with file and extracted_data');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formDataToSend,
        // Add timeout and headers for better debugging
        signal: AbortSignal.timeout(120000), // 2 minute timeout
        // Add explicit headers to help with CORS and debugging
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        console.error('Response status:', response.status, response.statusText);
        
        // Try to parse error text as JSON for more details
        let serverError = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          serverError = errorJson.message || errorJson.detail || errorText;
        } catch (e) {
          // If not JSON, use the raw text
        }
        
        throw new Error(`Server Error (${response.status}): ${serverError}`);
      }

      const result = await response.json();
      
      // Add result
      setResults(prev => [...prev, {
        fileId: Math.random().toString(36).substr(2, 9),
        pdfName: selectedPdf,
        fileName: selectedPdf,
        data: result,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('Processing error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause
      });
      
      let errorMessage = err.message;
      
      // Handle specific error types with more detailed information
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        if (err.message.includes('/forms/')) {
          errorMessage = `Cannot load PDF file: ${selectedPdf}. The file may not exist in the public/forms directory or there may be a network issue.`;
        } else {
          // This is likely the API connection issue
          errorMessage = `Cannot connect to API server at ${API_BASE_URL}. This could be due to:\n• Server is down or not responding\n• Network connectivity issues\n• CORS policy blocking the request\n• Firewall blocking the connection\n\nPlease check if the API server is running and accessible.`;
        }
      } else if (err.name === 'AbortError') {
        errorMessage = `Request timeout: The server at ${API_BASE_URL} took too long to respond (>2 minutes). This could indicate:\n• Server is overloaded\n• Large file processing taking too long\n• Network connectivity issues\n\nPlease try again or contact support.`;
      } else if (err.message.includes('NetworkError') || err.message.includes('net::')) {
        errorMessage = `Network error connecting to ${API_BASE_URL}. This could be:\n• Internet connectivity issues\n• DNS resolution problems\n• Server firewall blocking requests\n• CORS policy restrictions`;
      } else if (err.message.includes('PDF file not found')) {
        errorMessage = `${err.message} Please check if the file exists in the public/forms directory.`;
      } else if (err.message.includes('Failed to load PDF')) {
        errorMessage = `${err.message} This could be due to file permissions or server configuration issues.`;
      } else if (err.message.includes('Server Error')) {
        // This is already a formatted server error, keep it as is
        errorMessage = err.message;
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
    link.download = `${result.fileName.split('.')[0]}_result.json`;
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
      link.download = result.data.pdf_filename || `${result.fileName.split('.')[0]}_completed_form.pdf`;
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
      link.download = result.data.image_filename || `${result.fileName.split('.')[0]}_completed_form.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError('');
    setSelectedPdf('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const totalFiles = files.length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 min-h-[700px] hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col h-full">
        {/* Section Header */}
        <div className="text-center mb-8 relative">
          <div className={`absolute inset-0 ${bgGradient} opacity-5 rounded-3xl blur-3xl`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 ${bgGradient} rounded-2xl shadow-lg mr-3`}>
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            </div>
            {(totalFiles > 0 || selectedPdf) && (
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border">
                <Activity className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">
                  {selectedPdf ? `Selected: ${selectedPdf}` : `${completedFiles}/${totalFiles} files processed`}
                </span>
                {totalFiles > 0 && (
                  <div className="w-20 bg-slate-200 rounded-full h-2 ml-2">
                    <div 
                      className={`h-2 ${accentColor} rounded-full transition-all duration-500`}
                      style={{ width: `${totalFiles ? (completedFiles / totalFiles) * 100 : 0}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PDF Selection Area */}
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-600" />
              Pre-filled Forms (with cam-3_result.json)
            </h3>
            <div className="flex items-center gap-4">
              {API_BASE_URL && (
                <div className="text-xs text-slate-500">
                  API: {API_BASE_URL}
                </div>
              )}
              {formData && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  Form data loaded
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto mb-4">
            {availablePdfs.map((pdf) => (
              <button
                key={pdf}
                onClick={() => setSelectedPdf(pdf)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-sm ${
                  selectedPdf === pdf
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${selectedPdf === pdf ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium truncate">{pdf}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              {selectedPdf ? `Selected: ${selectedPdf}` : 'Select a PDF form to auto-fill with pre-extracted data'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={testApiConnection}
                disabled={testingConnection}
                className="bg-blue-500 hover:bg-blue-600 hover:shadow-md disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-2"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Test API
                  </>
                )}
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

        {/* Upload Area */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-500 font-medium">OR</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-slate-600" />
            Upload Your Own Documents
          </h3>
        </div>
        
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 mb-6 transition-all duration-500 cursor-pointer group ${
            dragActive
              ? `border-slate-400 bg-slate-50 scale-[1.02] shadow-lg`
              : `border-slate-200 bg-white/50`
          } hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-md backdrop-blur-sm`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="mb-4">
              <div className={`mx-auto w-16 h-16 ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                dragActive ? 'scale-110 shadow-xl' : 'group-hover:scale-105'
              }`}>
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
            </h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
              Upload medical forms and documents for intelligent processing
            </p>
            <input
              type="file"
              multiple
              accept={acceptedTypes.map(type => {
                if (type === 'application/pdf') return '.pdf';
                if (type === 'image/jpeg') return '.jpg,.jpeg';
                if (type === 'image/png') return '.png';
                return '';
              }).join(',')}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <button 
              className={`${bgGradient} hover:shadow-lg disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md inline-flex items-center gap-2`}
              disabled={uploading}
            >
              <Plus className="h-4 w-4" />
              Browse Files
            </button>
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

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 mb-6 flex-1 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Files ({files.length})
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={clearAll}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm"
                >
                  Clear All
                </button>
                <button
                  onClick={uploadFiles}
                  disabled={uploading || files.every(f => f.status !== 'pending')}
                  className={`${bgGradient} hover:shadow-md disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Process Files
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      {getStatusIcon(fileObj.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium truncate">
                        {fileObj.file.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 text-sm">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileObj.status === 'uploading' && (
                          <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-24">
                            <div className={`h-1.5 ${accentColor} rounded-full animate-pulse`} style={{width: '60%'}}></div>
                          </div>
                        )}
                      </div>
                      {fileObj.status === 'error' && (
                        <p className="text-red-500 text-sm mt-1 font-medium">{fileObj.error}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <h4 className="text-slate-800 font-semibold">{result.fileName}</h4>
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
        {files.length === 0 && !selectedPdf && (
          <div className="text-center py-16 flex-1 flex flex-col justify-center">
            <div className={`mx-auto w-20 h-20 ${bgGradient} rounded-3xl flex items-center justify-center shadow-lg mb-6 opacity-20`}>
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Ready to process forms</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              Select a PDF form for auto-filling with pre-extracted data, or upload your own documents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormEntry;