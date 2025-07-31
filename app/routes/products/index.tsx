import { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Chip, useDisclosure, Avatar, Tooltip } from '@heroui/react';
import { Plus, Edit, Trash2, Package, AlertTriangle, Eye, Search, Filter, Upload, X, Camera, StopCircle, Flashlight, FlashlightOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
// Barcode scanner will be loaded dynamically
import DataTable, { type Column } from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import CustomInput from '../../components/CustomInput';
import type { Product, Category, ProductFormData } from '../../types';
import { productsAPI, categoriesAPI } from '../../utils/api';
import { successToast, errorToast } from '../../components/toast';

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReader, setScannerReader] = useState<any>(null);
  const [scannerControls, setScannerControls] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanMode, setScanMode] = useState<'add' | 'quick'>('add');
  const [quickScanResults, setQuickScanResults] = useState<Product[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('Ready to scan...');
  const [isManualCapture, setIsManualCapture] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    maxStockLevel: 1000,
    unitOfMeasure: 'pcs',
    images: [],
    isActive: true,
    taxable: true,
    taxRate: 0,
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    location: '',
  });

  const { isOpen: deleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();
  const { isOpen: quickScanModalOpen, onOpen: openQuickScanModal, onOpenChange: onQuickScanModalChange } = useDisclosure();

  // Handle edit product from navigation state
  useEffect(() => {
    if (location.state?.editProduct) {
      handleEditProduct(location.state.editProduct);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsAPI.getAll({ limit: 1000 }),
        categoriesAPI.getAll()
      ]);
      
      // Handle API response structure
      const productsData = (productsResponse as any)?.data || productsResponse || [];
      const categoriesData = (categoriesResponse as any)?.data || categoriesResponse || [];
      
      // Debug: Log the first product and category to see the structure
      if (productsData.length > 0) {
        console.log('Sample product data:', productsData[0]);
      }
      if (categoriesData.length > 0) {
        console.log('Sample category data:', categoriesData[0]);
      }
      
      // Add id field for compatibility and ensure _id is preserved
      const processedProducts = Array.isArray(productsData) ? productsData.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        _id: p._id || p.id // Ensure _id is available for updates
      })) : [];
      
      const processedCategories = Array.isArray(categoriesData) ? categoriesData.map((c: any) => ({
        ...c,
        id: c._id || c.id,
        _id: c._id || c.id // Ensure _id is available
      })) : [];
      
      setProducts(processedProducts);
      setCategories(processedCategories);
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch data');
      console.error('Error loading data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const imagePromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        return await convertToBase64(file);
      });

      const base64Images = await Promise.all(imagePromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images]
      }));

      successToast(`${base64Images.length} image(s) uploaded successfully`);
    } catch (error: any) {
      errorToast(error.message || 'Failed to upload images');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  // Start barcode scanning
  const startScanning = async () => {
    try {
      // Check camera permissions first
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        setIsScanning(false);
        setScanningStatus('Camera access required');
        return;
      }

      setScanningStatus('Loading scanner...');

      // Dynamic import for barcode scanner
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { NotFoundException, DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      
      // Create reader with better configuration
      const reader = new BrowserMultiFormatReader();
      
      // Configure hints for better barcode detection
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
      setIsScanning(true);

      // Get video devices
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (videoDevices.length === 0) {
        errorToast('No camera found on this device');
        setIsScanning(false);
        return;
      }

      console.log('Available cameras:', videoDevices);

      // Try to use back camera first (better for barcode scanning)
      let selectedDeviceId = videoDevices[0].deviceId;
      
      // Look for back camera on mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
        console.log('Using back camera:', backCamera.label);
      } else {
        console.log('Using default camera:', videoDevices[0].label);
      }

      // Enhanced video constraints for better barcode scanning
      const constraints = {
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' },
          zoom: { ideal: 1 }
        }
      };

      // Start scanning
      if (videoRef.current) {
        // Wait a bit for video element to be ready
        setTimeout(async () => {
          if (videoRef.current) {
            try {
              console.log('Starting barcode detection with constraints:', constraints);
              
              // First try the constraint-based approach
              let controls;
              try {
                controls = await reader.decodeFromConstraints(constraints, videoRef.current, (result: any, err: any) => {
                  if (result) {
                    const barcode = result.getText();
                    const format = result.getBarcodeFormat();
                    console.log('✅ Barcode detected:', barcode, 'Format:', format);
                    setScanningStatus(`✅ Barcode detected: ${barcode}`);
                    
                    if (scanMode === 'add') {
                      // Add mode - populate the form barcode field
                      handleInputChange('barcode', barcode);
                      successToast(`Barcode scanned: ${barcode} (${format})`);
                      stopScanning();
                    } else {
                      // Quick scan mode - search for existing products
                      handleQuickScan(barcode);
                    }
                  }
                  if (err && !(err instanceof NotFoundException)) {
                    console.log('🔍 Scanner searching...', err.message || 'Processing frame');
                    setScanningStatus('🔍 Scanning for barcodes...');
                  }
                });
              } catch (constraintError) {
                console.warn('Constraint-based scanning failed, trying device-based:', constraintError);
                
                // Fallback to device-based scanning
                controls = await reader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result: any, err: any) => {
                  if (result) {
                    const barcode = result.getText();
                    const format = result.getBarcodeFormat();
                    console.log('✅ Barcode detected (fallback):', barcode, 'Format:', format);
                    setScanningStatus(`✅ Barcode detected: ${barcode}`);
                    
                    if (scanMode === 'add') {
                      handleInputChange('barcode', barcode);
                      successToast(`Barcode scanned: ${barcode} (${format})`);
                      stopScanning();
                    } else {
                      handleQuickScan(barcode);
                    }
                  }
                  if (err && !(err instanceof NotFoundException)) {
                    console.log('🔍 Scanner searching (fallback)...', err.message || 'Processing frame');
                    setScanningStatus('🔍 Scanning for barcodes...');
                  }
                });
              }
              
              // Store the controls object for later use
              setScannerControls(controls);
              console.log('Scanner started successfully');
              setScanningStatus('📷 Camera ready - Position barcode in the red frame');
              
              // Add torch control if available
              if (controls && typeof controls.switchTorch === 'function') {
                console.log('Torch control available');
              }
              
            } catch (scanError) {
              console.error('Error starting video scan:', scanError);
              errorToast('Failed to start video scanning. Please try again.');
              setIsScanning(false);
            }
          }
        }, 500); // Increased wait time for video to be ready
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      errorToast('Failed to start camera scanner. Please make sure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  // Stop barcode scanning
  const stopScanning = () => {
    try {
      // Use the controls object to stop scanning
      if (scannerControls && typeof scannerControls.stop === 'function') {
        scannerControls.stop();
        setScannerControls(null);
      }
      
      // Also try to reset the reader if available
      if (scannerReader) {
        if (typeof scannerReader.reset === 'function') {
          scannerReader.reset();
        }
        setScannerReader(null);
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    
    // Reset states
    setIsScanning(false);
    setTorchEnabled(false);
    setScanningStatus('Ready to scan...');
  };

  // Handle quick scan results
  const handleQuickScan = (barcode: string) => {
    const foundProducts = products.filter(product => 
      product.barcode === barcode || product.sku === barcode
    );
    
    if (foundProducts.length > 0) {
      setQuickScanResults(foundProducts);
      successToast(`Found ${foundProducts.length} product(s) with barcode: ${barcode}`);
      stopScanning();
      openQuickScanModal();
    } else {
      errorToast(`No products found with barcode: ${barcode}`);
      // Keep scanning for another barcode
    }
  };

  // Start quick scan mode
  const startQuickScan = () => {
    setScanMode('quick');
    setScanningStatus('Initializing camera...');
    startScanning();
  };

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (scannerControls && typeof scannerControls.switchTorch === 'function') {
      try {
        await scannerControls.switchTorch(!torchEnabled);
        setTorchEnabled(!torchEnabled);
        successToast(`Flashlight ${!torchEnabled ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error toggling torch:', error);
        errorToast('Failed to toggle flashlight');
      }
    } else {
      errorToast('Flashlight not available on this device');
    }
  };

  // Enhanced image preprocessing
  const preprocessImage = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
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
  };

  // Enhanced manual frame capture and scan with multiple methods
  const captureFrame = async () => {
    if (!videoRef.current || !scannerReader) {
      errorToast('Scanner not ready for manual capture');
      return;
    }

    try {
      setIsManualCapture(true);
      setScanningStatus('📸 Capturing frame...');
      
      const video = videoRef.current;
      console.log(`📸 Starting enhanced capture: ${video.videoWidth}x${video.videoHeight}`);
      
      // Wait for video to be stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let detectedBarcode = null;
      let detectedFormat = null;
      let successMethod = null;
      
      // Method 1: Try original frame
      console.log('🔍 Attempt 1: Scanning original frame');
      setScanningStatus('🔍 Method 1: Original frame...');
      try {
        const canvas1 = document.createElement('canvas');
        canvas1.width = video.videoWidth;
        canvas1.height = video.videoHeight;
        const ctx1 = canvas1.getContext('2d');
        if (!ctx1) throw new Error('Cannot create canvas context');
        ctx1.drawImage(video, 0, 0);
        
        console.log('Method 1: Canvas created, attempting decode...');
        const result1 = await scannerReader.decodeFromCanvas(canvas1);
        if (result1) {
          detectedBarcode = result1.getText();
          detectedFormat = String(result1.getBarcodeFormat());
          successMethod = 'Original';
          console.log('✅ Success (Original):', detectedBarcode, 'Format:', detectedFormat);
        } else {
          console.log('Method 1: No result from decodeFromCanvas');
        }
      } catch (e: any) {
        console.log('❌ Method 1 failed:', e.message);
      }
      
      // Method 2: Try with preprocessing
      if (!detectedBarcode) {
        console.log('🔍 Attempt 2: Scanning with preprocessing');
        setScanningStatus('🔍 Method 2: Enhanced contrast...');
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const canvas2 = document.createElement('canvas');
          canvas2.width = video.videoWidth;
          canvas2.height = video.videoHeight;
          const ctx2 = canvas2.getContext('2d');
          if (!ctx2) throw new Error('Cannot create canvas context');
          ctx2.drawImage(video, 0, 0);
          
          // Apply preprocessing
          console.log('Method 2: Applying image preprocessing...');
          preprocessImage(canvas2, ctx2);
          
          const result2 = await scannerReader.decodeFromCanvas(canvas2);
          if (result2) {
            detectedBarcode = result2.getText();
            detectedFormat = String(result2.getBarcodeFormat());
            successMethod = 'Preprocessed';
            console.log('✅ Success (Preprocessed):', detectedBarcode, 'Format:', detectedFormat);
          } else {
            console.log('Method 2: No result from preprocessed canvas');
          }
        } catch (e: any) {
          console.log('❌ Method 2 failed:', e.message);
        }
      }
      
      // Method 3: Try with scaling
      if (!detectedBarcode) {
        console.log('🔍 Attempt 3: Scanning with scaling');
        setScanningStatus('🔍 Method 3: High-resolution...');
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const scale = 2;
          const canvas3 = document.createElement('canvas');
          canvas3.width = video.videoWidth * scale;
          canvas3.height = video.videoHeight * scale;
          const ctx3 = canvas3.getContext('2d');
          if (!ctx3) throw new Error('Cannot create canvas context');
          
          // Use high-quality image smoothing
          ctx3.imageSmoothingEnabled = true;
          ctx3.imageSmoothingQuality = 'high';
          ctx3.drawImage(video, 0, 0, canvas3.width, canvas3.height);
          
          console.log(`Method 3: Created scaled canvas ${canvas3.width}x${canvas3.height}`);
          const result3 = await scannerReader.decodeFromCanvas(canvas3);
          if (result3) {
            detectedBarcode = result3.getText();
            detectedFormat = String(result3.getBarcodeFormat());
            successMethod = 'Scaled';
            console.log('✅ Success (Scaled):', detectedBarcode, 'Format:', detectedFormat);
          } else {
            console.log('Method 3: No result from scaled canvas');
          }
        } catch (e: any) {
          console.log('❌ Method 3 failed:', e.message);
        }
      }
      
      // Method 4: Try with alternative reader configuration
      if (!detectedBarcode) {
        console.log('🔍 Attempt 4: Alternative reader configuration');
        setScanningStatus('🔍 Method 4: Alternative detection...');
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
          
          const altReader = new BrowserMultiFormatReader();
          const altHints = new Map();
          altHints.set(DecodeHintType.TRY_HARDER, true);
          altHints.set(DecodeHintType.PURE_BARCODE, false);
          altHints.set(DecodeHintType.ASSUME_GS1, false);
          altHints.set(DecodeHintType.POSSIBLE_FORMATS, [
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
            BarcodeFormat.AZTEC
          ]);
          
          altReader.setHints(altHints);
          
          const canvas4 = document.createElement('canvas');
          canvas4.width = video.videoWidth;
          canvas4.height = video.videoHeight;
          const ctx4 = canvas4.getContext('2d');
          if (!ctx4) throw new Error('Cannot create canvas context');
          ctx4.drawImage(video, 0, 0);
          
          console.log('Method 4: Using alternative reader configuration...');
          const result4 = await altReader.decodeFromCanvas(canvas4);
          if (result4) {
            detectedBarcode = result4.getText();
            detectedFormat = String(result4.getBarcodeFormat());
            successMethod = 'Alternative';
            console.log('✅ Success (Alternative):', detectedBarcode, 'Format:', detectedFormat);
          } else {
            console.log('Method 4: No result from alternative reader');
          }
        } catch (e: any) {
          console.log('❌ Method 4 failed:', e.message);
        }
      }
      
      // Method 5: Try QR-specific detection
      if (!detectedBarcode) {
        console.log('🔍 Attempt 5: QR-specific detection');
        setScanningStatus('🔍 Method 5: QR-specific...');
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const { BrowserQRCodeReader } = await import('@zxing/browser');
          
          const qrReader = new BrowserQRCodeReader();
          
          const canvas5 = document.createElement('canvas');
          canvas5.width = video.videoWidth;
          canvas5.height = video.videoHeight;
          const ctx5 = canvas5.getContext('2d');
          if (!ctx5) throw new Error('Cannot create canvas context');
          ctx5.drawImage(video, 0, 0);
          
          console.log('Method 5: Using QR-specific reader...');
          const result5 = await qrReader.decodeFromCanvas(canvas5);
          if (result5) {
            detectedBarcode = result5.getText();
            detectedFormat = String(result5.getBarcodeFormat());
            successMethod = 'QR-Specific';
            console.log('✅ Success (QR-Specific):', detectedBarcode, 'Format:', detectedFormat);
          } else {
            console.log('Method 5: No result from QR-specific reader');
          }
        } catch (e: any) {
          console.log('❌ Method 5 failed:', e.message);
        }
      }
      
      // Process results
      if (detectedBarcode) {
        console.log(`✅ Enhanced capture SUCCESS via ${successMethod}:`, detectedBarcode, 'Format:', detectedFormat);
        setScanningStatus(`✅ ${successMethod} scan: ${detectedBarcode}`);
        
        if (scanMode === 'add') {
          handleInputChange('barcode', detectedBarcode);
          successToast(`Barcode captured via ${successMethod}: ${detectedBarcode} (${detectedFormat})`);
          stopScanning();
        } else {
          handleQuickScan(detectedBarcode);
        }
      } else {
        setScanningStatus('❌ No barcode found after all 5 attempts');
        errorToast('No barcode detected after trying all 5 methods. Try better lighting, different angle, or move closer.');
        console.log('💡 All methods failed. Try:');
        console.log('   - Better lighting');
        console.log('   - Hold camera steady');
        console.log('   - Move closer to barcode');
        console.log('   - Try different angle');
        console.log('   - Ensure barcode is clear and unobstructed');
      }
      
    } catch (error: any) {
      console.error('Enhanced capture error:', error);
      setScanningStatus('❌ Capture failed');
      errorToast(`Enhanced capture failed: ${error.message}`);
    } finally {
      setIsManualCapture(false);
    }
  };

  // Check camera permissions
  const checkCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorToast('Camera access denied. Please allow camera permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          errorToast('No camera found on this device.');
        } else if (error.name === 'NotSupportedError') {
          errorToast('Camera not supported on this device.');
        } else {
          errorToast('Failed to access camera. Please check permissions.');
        }
      }
      return false;
    }
  };

  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      try {
        // Use the controls object to stop scanning
        if (scannerControls && typeof scannerControls.stop === 'function') {
          scannerControls.stop();
        }
        
        // Also try to reset the reader if available
        if (scannerReader && typeof scannerReader.reset === 'function') {
          scannerReader.reset();
        }
      } catch (error) {
        console.error('Error cleaning up scanner:', error);
      }
    };
  }, [scannerReader, scannerControls]);

  // Open drawer for adding new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsEditing(false);
    setScanMode('add'); // Set scan mode to add when adding new product
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 1000,
      unitOfMeasure: 'pcs',
      images: [],
      isActive: true,
      taxable: true,
      taxRate: 0,
      expiryDate: '',
      batchNumber: '',
      supplier: '',
      location: '',
    });
    setIsDrawerOpen(true);
  };

  // Open drawer for editing product
  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setSelectedProduct(product);
    setIsEditing(true);
    
    // Handle categoryId - it might be populated object or just ID
    let categoryId = '';
    if (typeof product.categoryId === 'string') {
      categoryId = product.categoryId;
    } else if (product.categoryId && typeof product.categoryId === 'object') {
      categoryId = (product.categoryId as any)._id || (product.categoryId as any).id || '';
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: categoryId,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel || 1000,
      unitOfMeasure: product.unitOfMeasure,
      images: product.images || [],
      isActive: product.isActive,
      taxable: product.taxable,
      taxRate: product.taxRate || 0,
      expiryDate: product.expiryDate || '',
      batchNumber: product.batchNumber || '',
      supplier: product.supplier || '',
      location: product.location || '',
    });
    
    console.log('Form data set for editing:', {
      name: product.name,
      categoryId: categoryId,
      price: product.price,
      stockQuantity: product.stockQuantity
    });
    
    setIsDrawerOpen(true);
  };

  // Handle view product
  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.sku || !formData.categoryId) {
        errorToast('Please fill in all required fields');
        return;
      }

      if (isEditing && selectedProduct) {
        // Use _id if available, otherwise use id
        const productId = selectedProduct._id || selectedProduct.id;
        console.log('Updating product with ID:', productId, 'Form data:', formData);
        
        const result = await productsAPI.update(productId, formData);
        console.log('Update result:', result);
        
        successToast('Product updated successfully');
      } else {
        console.log('Creating new product with form data:', formData);
        
        const result = await productsAPI.create(formData);
        console.log('Create result:', result);
        
        successToast('Product created successfully');
      }

      setIsDrawerOpen(false);
      fetchData(); // Reload products after create/update
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Handle different error formats
      let errorMessage = 'Failed to save product';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      errorToast(errorMessage);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await productsAPI.delete(selectedProduct.id);
      successToast('Product deleted successfully');
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      onDeleteModalChange();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete product');
      console.error('Error deleting product:', error);
    }
  };

  // Confirm delete
  const confirmDelete = (product: Product) => {
    setSelectedProduct(product);
    openDeleteModal();
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'N/A';
    
    // First try to find by direct ID match
    const category = categories.find(c => {
      return c.id === categoryId || c._id === categoryId || 
             (c as any)._id?.toString() === categoryId || 
             (c as any).id?.toString() === categoryId;
    });
    
    return category?.name || 'N/A';
  };

  // Custom search function for products - only search name, category, and price
  const customProductSearchFilter = (product: Product, searchTerm: string): boolean => {
    const search = searchTerm.toLowerCase();
    
    // Search in product name
    if (product.name.toLowerCase().includes(search)) {
      return true;
    }
    
    // Search in category name
    let categoryName = 'N/A';
    if (typeof (product as any).categoryId === 'object' && (product as any).categoryId?.name) {
      categoryName = (product as any).categoryId.name;
    } else if (typeof product.categoryId === 'string') {
      const category = categories.find(c => 
        c.id === product.categoryId || 
        c._id === product.categoryId ||
        (c as any)._id?.toString() === product.categoryId ||
        (c as any).id?.toString() === product.categoryId
      );
      categoryName = category?.name || 'N/A';
    }
    
    if (categoryName.toLowerCase().includes(search)) {
      return true;
    }
    
    // Search in price (convert to string to allow partial matches like "5" matching "$5.99")
    if (product.price.toString().includes(search) || `$${product.price.toFixed(2)}`.includes(search)) {
      return true;
    }
    
    return false;
  };

  // Table columns
  const columns: Column<Product>[] = [
    {
      key: 'product',
      title: 'Product',
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {record.images && record.images.length > 0 ? (
              <img 
                src={record.images[0]} 
                alt={record.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {record.sku}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      render: (value, record) => {
        // Handle different possible data structures
        let categoryName = 'N/A';
        
        // If categoryId is populated (object with name)
        if (typeof (record as any).categoryId === 'object' && (record as any).categoryId?.name) {
          categoryName = (record as any).categoryId.name;
        } 
        // If categoryId is just an ID string, look it up in categories array
        else if (typeof record.categoryId === 'string') {
          const category = categories.find(c => 
            c.id === record.categoryId || 
            c._id === record.categoryId ||
            (c as any)._id?.toString() === record.categoryId ||
            (c as any).id?.toString() === record.categoryId
          );
          categoryName = category?.name || 'N/A';
        }
        
        return (
          <Chip
            variant="flat"
            size="sm"
            className="font-medium"
          >
            {categoryName}
          </Chip>
        );
      }
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      key: 'stockQuantity',
      title: 'Stock',
      sortable: true,
      render: (value, record) => {
        const isLowStock = value <= record.minStockLevel;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {value} {record.unitOfMeasure}
            </span>
            {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => (
        <Chip 
          color={value ? 'success' : 'default'} 
          variant="flat" 
          size="sm"
          className="font-medium"
        >
          {value ? 'Active' : 'Inactive'}
        </Chip>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Tooltip content="View Details">
            <button
              onClick={() => handleViewProduct(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Eye className="w-4 h-4 text-primary" />
            </button>
          </Tooltip>
          <Tooltip content="Edit Product">
            <button
              onClick={() => handleEditProduct(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Edit className="w-4 h-4 text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Delete Product">
            <button
              onClick={() => confirmDelete(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
          </Tooltip>
        </div>
      )
    }
  ];

  // Stats calculations
  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'text-blue-500'
    },
    {
      title: 'Active Products',
      value: products.filter(p => p.isActive).length,
      icon: Package,
      color: 'text-green-500'
    },
    {
      title: 'Low Stock Items',
      value: products.filter(p => p.stockQuantity <= p.minStockLevel).length,
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Categories',
      value: categories.length,
      icon: Filter,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product inventory and catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="bordered"
            onClick={isScanning && scanMode === 'quick' ? stopScanning : startQuickScan}
            startContent={isScanning && scanMode === 'quick' ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            color={isScanning && scanMode === 'quick' ? "danger" : "default"}
          >
            {isScanning && scanMode === 'quick' ? 'Stop Scan' : 'Quick Scan'}
          </Button>
          <Button
            color="primary"
            onClick={handleAddProduct}
            startContent={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="customed-dark-card">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800">
                    <IconComponent className={`w-6 h-6 ${stat.color} dark:opacity-80`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by product name, category, or price..."
        emptyText="No products found. Get started by adding your first product."
        customSearchFilter={customProductSearchFilter}
      />

      {/* Product Form Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProduct(null);
          setIsEditing(false);
        }}
        title={isEditing && selectedProduct ? `Edit Product: ${selectedProduct.name}` : 'Add New Product'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
           
            <div className="space-y-4">
              <CustomInput
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                required
              />
              
              <CustomInput
                label="Description"
                placeholder="Enter product description"
                type="textarea"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="SKU"
                  placeholder="Enter SKU"
                  value={formData.sku}
                  onChange={(value) => handleInputChange('sku', value)}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barcode
                  </label>
                  <div className="flex gap-2">
                    <CustomInput
                      placeholder="Enter barcode or scan"
                      value={formData.barcode}
                      onChange={(value) => handleInputChange('barcode', value)}
                      className="flex-1"
                    />
                    <Button
                      variant="bordered"
                      onClick={isScanning && scanMode === 'add' ? stopScanning : () => {
                        setScanMode('add');
                        startScanning();
                      }}
                      className="px-3"
                      color={isScanning && scanMode === 'add' ? "danger" : "primary"}
                    >
                      {isScanning && scanMode === 'add' ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white customed-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <CustomInput
                  label="Unit of Measure"
                  placeholder="e.g., pcs, kg, lbs"
                  value={formData.unitOfMeasure}
                  onChange={(value) => handleInputChange('unitOfMeasure', value)}
                />
              </div>
            </div>
          </div>

          {/* Barcode Scanner - Only show in add product mode */}
          {isScanning && scanMode === 'add' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Barcode Scanner
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg border border-gray-300 dark:border-gray-600"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-32 border-2 border-red-500 rounded-lg opacity-50">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500"></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-3 flex-wrap">
                  <Button
                    color="danger"
                    variant="bordered"
                    onClick={stopScanning}
                    startContent={<StopCircle className="w-4 h-4" />}
                  >
                    Stop Scanning
                  </Button>
                  <Button
                    color="secondary"
                    variant="bordered"
                    onClick={captureFrame}
                    startContent={<Camera className="w-4 h-4" />}
                    disabled={isManualCapture}
                  >
                    {isManualCapture ? 'Enhanced Scanning...' : 'Capture Frame'}
                  </Button>
                  {scannerControls && (
                    <Button
                      variant="bordered"
                      onClick={toggleTorch}
                      startContent={torchEnabled ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                      color={torchEnabled ? "warning" : "default"}
                    >
                      {torchEnabled ? 'Flash Off' : 'Flash On'}
                    </Button>
                  )}
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {scanningStatus}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: Use "Capture Frame" for difficult barcodes • Good lighting helps auto-scan
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Product Images
            </h3>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Images (Max 5MB each, JPG/PNG/GIF)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="bordered"
                    onClick={() => fileInputRef.current?.click()}
                    startContent={<Upload className="w-4 h-4" />}
                  >
                    Choose Images
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.images?.length || 0} image(s) selected
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {formData.images && formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pricing & Stock
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Sale Price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price.toString()}
                  onChange={(value) => handleInputChange('price', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                />
                
                <CustomInput
                  label="Cost Price"
                  type="number"
                  placeholder="0.00"
                  value={formData.costPrice.toString()}
                  onChange={(value) => handleInputChange('costPrice', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <CustomInput
                  label="Current Stock"
                  type="number"
                  placeholder="0"
                  value={formData.stockQuantity.toString()}
                  onChange={(value) => handleInputChange('stockQuantity', parseInt(value) || 0)}
                  min="0"
                />
                
                <CustomInput
                  label="Min Stock Level"
                  type="number"
                  placeholder="5"
                  value={formData.minStockLevel.toString()}
                  onChange={(value) => handleInputChange('minStockLevel', parseInt(value) || 0)}
                  min="0"
                />
                
                <CustomInput
                  label="Max Stock Level"
                  type="number"
                  placeholder="1000"
                  value={formData.maxStockLevel?.toString() || ''}
                  onChange={(value) => handleInputChange('maxStockLevel', parseInt(value) || undefined)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Supplier"
                  placeholder="Enter supplier name"
                  value={formData.supplier}
                  onChange={(value) => handleInputChange('supplier', value)}
                />
                
                <CustomInput
                  label="Location"
                  placeholder="Enter storage location"
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Batch Number"
                  placeholder="Enter batch number"
                  value={formData.batchNumber}
                  onChange={(value) => handleInputChange('batchNumber', value)}
                />
                
                <CustomInput
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(value) => handleInputChange('expiryDate', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Tax Rate (%)"
                  type="number"
                  placeholder="0"
                  value={formData.taxRate?.toString() || ''}
                  onChange={(value) => handleInputChange('taxRate', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                  max="100"
                />
                
                <div className="flex items-center space-x-4 pt-8">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.taxable}
                      onChange={(e) => handleInputChange('taxable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Taxable
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Active
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedProduct(null);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={onDeleteModalChange}
        header="Delete Product"
        content={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-center space-x-3">
          <Button
            variant="ghost"
            onClick={onDeleteModalChange}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onClick={handleDeleteProduct}
          >
            Delete Product
          </Button>
        </div>
      </ConfirmModal>

      {/* Quick Scan Results Modal */}
      <ConfirmModal
        isOpen={quickScanModalOpen}
        onOpenChange={onQuickScanModalChange}
        header="Quick Scan Results"
        content={`Found ${quickScanResults.length} product(s) matching the scanned barcode:`}
      >
        <div className="space-y-4">
          {quickScanResults.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {product.sku} | Stock: {product.stockQuantity} {product.unitOfMeasure}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onClick={() => {
                    handleViewProduct(product);
                    onQuickScanModalChange();
                  }}
                  startContent={<Eye className="w-4 h-4" />}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => {
                    handleEditProduct(product);
                    onQuickScanModalChange();
                  }}
                  startContent={<Edit className="w-4 h-4" />}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-center space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={onQuickScanModalChange}
            >
              Close
            </Button>
            <Button
              color="primary"
              onClick={() => {
                onQuickScanModalChange();
                startQuickScan();
              }}
            >
              Scan Another
            </Button>
          </div>
                 </div>
       </ConfirmModal>

      {/* Quick Scan Camera Modal */}
      {isScanning && scanMode === 'quick' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-white customed-dark-card rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quick Scan - Find Products
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={stopScanning}
                    className="min-w-unit-8 w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg border border-gray-300 dark:border-gray-600"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-32 border-2 border-red-500 rounded-lg opacity-50">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-3 flex-wrap">
                    <Button
                      color="danger"
                      variant="bordered"
                      onClick={stopScanning}
                      startContent={<StopCircle className="w-4 h-4" />}
                    >
                      Stop Scanning
                    </Button>
                    <Button
                      color="secondary"
                      variant="bordered"
                      onClick={captureFrame}
                      startContent={<Camera className="w-4 h-4" />}
                      disabled={isManualCapture}
                    >
                      {isManualCapture ? 'Enhanced Scanning...' : 'Capture Frame'}
                    </Button>
                    {scannerControls && (
                      <Button
                        variant="bordered"
                        onClick={toggleTorch}
                        startContent={torchEnabled ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                        color={torchEnabled ? "warning" : "default"}
                      >
                        {torchEnabled ? 'Flash Off' : 'Flash On'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {scanningStatus}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      📱 Scanning for products • 🎯 Use "Capture Frame" for difficult barcodes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 