import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Upload, Camera, X, FileImage, CheckCircle, AlertCircle } from 'lucide-react';

interface ScanResult {
  text: string;
  format: string;
  rawResult: any;
}

const ImageBarcodeTest: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<{message: string, type: 'info' | 'success' | 'error'}>({
    message: 'Ready to scan an image',
    type: 'info'
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [scannerReader, setScannerReader] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const updateStatus = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus({ message, type });
    addLog(`STATUS: ${message}`);
  }, [addLog]);

  const initializeReader = useCallback(async () => {
    if (scannerReader) return scannerReader;

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');

      const reader = new BrowserMultiFormatReader();
      
      // Configure hints for comprehensive barcode detection
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.PURE_BARCODE, false);
      hints.set(DecodeHintType.ASSUME_GS1, false);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.PDF_417,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
        BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED
      ]);

      reader.setHints(hints);
      setScannerReader(reader);
      addLog('Scanner initialized with comprehensive format support');
      return reader;
    } catch (error) {
      addLog(`Error initializing scanner: ${error}`);
      throw error;
    }
  }, [scannerReader, addLog]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;
    
    addLog(`Selected file: ${file.name} (${file.size} bytes)`);
    
    if (!file.type.startsWith('image/')) {
      updateStatus('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const result = e.target?.result as string;
      setCurrentImage(result);
      updateStatus('Image loaded - ready to scan', 'info');
    };
    reader.readAsDataURL(file);
  }, [addLog, updateStatus]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const preprocessImage = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Increase contrast
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const enhanced = Math.min(255, Math.max(0, factor * (avg - 128) + 128));
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, []);

  const scanImage = useCallback(async () => {
    if (!currentImage) {
      updateStatus('No image selected', 'error');
      return;
    }

    try {
      setIsScanning(true);
      updateStatus('Scanning image...', 'info');
      addLog('Starting enhanced image scan');
      
      const reader = await initializeReader();
      
      // Create image element
      const img = new Image();
      img.onload = async function() {
        try {
          addLog(`Image loaded: ${img.width}x${img.height}`);
          
          const results: ScanResult[] = [];
          
          // Method 1: Try original image
          addLog('Attempt 1: Scanning original image');
          try {
            const canvas1 = document.createElement('canvas');
            canvas1.width = img.width;
            canvas1.height = img.height;
            const ctx1 = canvas1.getContext('2d');
            if (!ctx1) throw new Error('Cannot create canvas context');
            ctx1.drawImage(img, 0, 0);
            
                         const result1 = await reader.decodeFromCanvas(canvas1);
             if (result1) {
               const barcode = result1.getText();
               const format = String(result1.getBarcodeFormat());
               addLog(`SUCCESS (Original): ${barcode} (${format})`);
               results.push({ text: barcode, format: format, rawResult: result1 });
             }
          } catch (e: any) {
            addLog(`Attempt 1 failed: ${e.message}`);
          }
          
          // Method 2: Try with preprocessing
          if (results.length === 0) {
            addLog('Attempt 2: Scanning with image preprocessing');
            try {
              const canvas2 = document.createElement('canvas');
              canvas2.width = img.width;
              canvas2.height = img.height;
              const ctx2 = canvas2.getContext('2d');
              if (!ctx2) throw new Error('Cannot create canvas context');
              ctx2.drawImage(img, 0, 0);
              
              // Apply preprocessing
              preprocessImage(canvas2, ctx2);
              
                             const result2 = await reader.decodeFromCanvas(canvas2);
               if (result2) {
                 const barcode = result2.getText();
                 const format = String(result2.getBarcodeFormat());
                 addLog(`SUCCESS (Preprocessed): ${barcode} (${format})`);
                 results.push({ text: barcode, format: format, rawResult: result2 });
               }
            } catch (e: any) {
              addLog(`Attempt 2 failed: ${e.message}`);
            }
          }
          
          // Method 3: Try with different scaling
          if (results.length === 0) {
            addLog('Attempt 3: Scanning with scaled image');
            try {
              const scale = 2;
              const canvas3 = document.createElement('canvas');
              canvas3.width = img.width * scale;
              canvas3.height = img.height * scale;
              const ctx3 = canvas3.getContext('2d');
              if (!ctx3) throw new Error('Cannot create canvas context');
              
              // Use image smoothing for better quality
              ctx3.imageSmoothingEnabled = true;
              ctx3.imageSmoothingQuality = 'high';
              ctx3.drawImage(img, 0, 0, canvas3.width, canvas3.height);
              
                             const result3 = await reader.decodeFromCanvas(canvas3);
               if (result3) {
                 const barcode = result3.getText();
                 const format = String(result3.getBarcodeFormat());
                 addLog(`SUCCESS (Scaled): ${barcode} (${format})`);
                 results.push({ text: barcode, format: format, rawResult: result3 });
               }
            } catch (e: any) {
              addLog(`Attempt 3 failed: ${e.message}`);
            }
          }
          
          // Method 4: Try with different reader configuration
          if (results.length === 0) {
            addLog('Attempt 4: Scanning with alternative reader configuration');
            try {
              const { BrowserMultiFormatReader } = await import('@zxing/browser');
              const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
              
              const altReader = new BrowserMultiFormatReader();
              const altHints = new Map();
              altHints.set(DecodeHintType.TRY_HARDER, true);
              altHints.set(DecodeHintType.PURE_BARCODE, true);
              altHints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
              
              altReader.setHints(altHints);
              
              const canvas4 = document.createElement('canvas');
              canvas4.width = img.width;
              canvas4.height = img.height;
              const ctx4 = canvas4.getContext('2d');
              if (!ctx4) throw new Error('Cannot create canvas context');
              ctx4.drawImage(img, 0, 0);
              
                             const result4 = await altReader.decodeFromCanvas(canvas4);
               if (result4) {
                 const barcode = result4.getText();
                 const format = String(result4.getBarcodeFormat());
                 addLog(`SUCCESS (Alternative): ${barcode} (${format})`);
                 results.push({ text: barcode, format: format, rawResult: result4 });
               }
            } catch (e: any) {
              addLog(`Attempt 4 failed: ${e.message}`);
            }
          }
          
          // Show results
          if (results.length > 0) {
            updateStatus(`✅ Barcode detected: ${results[0].text}`, 'success');
            setScanResults(results);
          } else {
            updateStatus('❌ No barcode found after all attempts', 'error');
            addLog('All scanning attempts failed');
            addLog('Tips: Try with better lighting, higher resolution, or clearer image');
            setScanResults([]);
          }
          
        } catch (scanError: any) {
          addLog(`Scan error: ${scanError.message}`);
          updateStatus(`Scan failed: ${scanError.message}`, 'error');
        } finally {
          setIsScanning(false);
        }
      };
      
      img.onerror = function() {
        updateStatus('Failed to load image', 'error');
        addLog('Image loading failed');
        setIsScanning(false);
      };
      
      img.src = currentImage;
      
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      updateStatus(`Error: ${error.message}`, 'error');
      setIsScanning(false);
    }
  }, [currentImage, initializeReader, addLog, updateStatus, preprocessImage]);

  const clearResults = useCallback(() => {
    setCurrentImage(null);
    setScanResults([]);
    updateStatus('Ready to scan an image', 'info');
    addLog('Results cleared');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [updateStatus, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('Logs cleared');
  }, [addLog]);

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <FileImage className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Image Barcode Scanner Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload an image containing a QR code or barcode to test the scanning functionality.
        </p>
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Drop an image here or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports: JPG, PNG, GIF, WebP
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button
            color="primary"
            variant="solid"
            onClick={scanImage}
            disabled={!currentImage || isScanning}
            startContent={<Camera className="w-4 h-4" />}
          >
            {isScanning ? 'Scanning...' : 'Scan Image'}
          </Button>
          <Button
            color="danger"
            variant="bordered"
            onClick={clearResults}
            disabled={!currentImage && scanResults.length === 0}
            startContent={<X className="w-4 h-4" />}
          >
            Clear Results
          </Button>
        </div>

        {/* Status */}
        <div className={`mt-6 p-4 rounded-lg border flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{status.message}</span>
        </div>
      </div>

      {/* Image Preview */}
      {currentImage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Image Preview
          </h2>
          <div className="text-center">
            <img
              ref={imageRef}
              src={currentImage}
              alt="Uploaded image"
              className="max-w-full max-h-96 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Scan Results
          </h2>
          <div className="space-y-4">
            {scanResults.map((result, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mb-2">
                  🎯 Barcode #{index + 1}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-20">Content:</span>
                    <span className="text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {result.text}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-20">Format:</span>
                    <span className="text-gray-900 dark:text-white">{result.format}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-20">Length:</span>
                    <span className="text-gray-900 dark:text-white">{result.text.length} characters</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Debug Logs
          </h2>
          <Button
            size="sm"
            variant="bordered"
            onClick={clearLogs}
            startContent={<X className="w-3 h-3" />}
          >
            Clear Logs
          </Button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index} className="text-gray-700 dark:text-gray-300">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 italic">
              No logs yet - upload an image to start testing
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageBarcodeTest; 