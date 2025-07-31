import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Tabs,
  Tab
} from '@heroui/react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Receipt,
  UserPlus,
  Tag,
  Percent,
  X,
  Check,
  Smartphone,
  Camera,
  StopCircle,
  Flashlight,
  FlashlightOff
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { productsAPI, customersAPI, salesAPI } from '../../utils/api';
import CustomInput from '../../components/CustomInput';
import { useStoreData } from '../../hooks/useStore';
import type { Product, Customer, CartItem, Cart } from '../../types';

const DEFAULT_TAX_RATE = 0; // Tax disabled by default
const CURRENCY = '₵'; // Ghana Cedis

export default function POSPage() {
  // Store data
  const { store, formatCurrency: storeFormatCurrency, formatDate, isStoreOpen } = useStoreData();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Barcode scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReader, setScannerReader] = useState<any>(null);
  const [scannerControls, setScannerControls] = useState<any>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('Ready to scan entire view...');
  const [isManualCapture, setIsManualCapture] = useState(false);
  const [scannerProcessing, setScannerProcessing] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState<number>(0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [change, setChange] = useState<number>(0);

  // Discount state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Modals
  const { isOpen: isCustomerModalOpen, onOpen: openCustomerModal, onOpenChange: onCustomerModalChange } = useDisclosure();
  const { isOpen: isPaymentModalOpen, onOpen: openPaymentModal, onOpenChange: onPaymentModalChange } = useDisclosure();
  const { isOpen: isReceiptModalOpen, onOpen: openReceiptModal, onOpenChange: onReceiptModalChange } = useDisclosure();
  const { isOpen: isScannerModalOpen, onOpen: openScannerModal, onOpenChange: onScannerModalChange } = useDisclosure();

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Current user (seller)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Refs for scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerProcessingRef = useRef<boolean>(false);
  const lastDetectionTimeRef = useRef<number>(0);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  useEffect(() => {
    calculateCart();
  }, [cart.items, discountValue, discountType]);

  useEffect(() => {
    if (paymentMethod === 'cash' && amountReceived > 0) {
      setChange(Math.max(0, amountReceived - cart.totalAmount));
    } else {
      setChange(0);
    }
  }, [amountReceived, cart.totalAmount, paymentMethod]);

  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      try {
        if (scannerControls && typeof scannerControls.stop === 'function') {
          scannerControls.stop();
        }
        if (scannerReader && typeof scannerReader.reset === 'function') {
          scannerReader.reset();
        }
        setScannerProcessing(false);
        scannerProcessingRef.current = false;
        setLastDetectionTime(0);
        lastDetectionTimeRef.current = 0;
      } catch (error) {
        console.error('Error cleaning up scanner:', error);
      }
    };
  }, [scannerReader, scannerControls]);

  const loadCurrentUser = () => {
    // Get current user from localStorage or session
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const getTaxRate = () => {
    // Get tax rate from store settings or use default
    // Use nullish coalescing to properly handle 0 as a valid tax rate
    return store?.taxSettings?.rate ?? DEFAULT_TAX_RATE;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, customersResponse] = await Promise.all([
        productsAPI.getAll({ limit: 1000 }),
        customersAPI.getAll({ limit: 1000 })
      ]);

      const productsData = (productsResponse as any)?.data || productsResponse || [];
      const customersData = (customersResponse as any)?.data || customersResponse || [];

      // Normalize products to have both _id and id fields
      const normalizedProducts = productsData
        .filter((p: Product) => p.isActive)
        .map((p: any) => ({
          ...p,
          id: p._id || p.id
        }));

      setProducts(normalizedProducts);
      setCustomers(customersData);
    } catch (error) {
      errorToast('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products); // Show all products
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered); // Show all filtered results
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
      setScannerProcessing(false);
      scannerProcessingRef.current = false;
      setLastDetectionTime(0);
      lastDetectionTimeRef.current = 0;
      openScannerModal();

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
                  const currentTime = Date.now();
                  if (result && !scannerProcessingRef.current && (currentTime - lastDetectionTimeRef.current >= 1000)) {
                    const barcode = result.getText();
                    const format = result.getBarcodeFormat();
                    console.log('✅ Barcode detected:', barcode, 'Format:', format);
                    setScanningStatus(`✅ Barcode detected: ${barcode}`);
                    
                    // Search for product and add to cart
                    handleBarcodeDetected(barcode, format);
                  }
                  if (err && !(err instanceof NotFoundException) && !scannerProcessingRef.current) {
                    console.log('🔍 Scanner searching...', err.message || 'Processing frame');
                    setScanningStatus('🔍 Scanning entire view for barcodes...');
                  }
                });
              } catch (constraintError) {
                console.warn('Constraint-based scanning failed, trying device-based:', constraintError);
                
                // Fallback to device-based scanning
                controls = await reader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result: any, err: any) => {
                  const currentTime = Date.now();
                  if (result && !scannerProcessingRef.current && (currentTime - lastDetectionTimeRef.current >= 1000)) {
                    const barcode = result.getText();
                    const format = result.getBarcodeFormat();
                    console.log('✅ Barcode detected (fallback):', barcode, 'Format:', format);
                    setScanningStatus(`✅ Barcode detected: ${barcode}`);
                    
                    // Search for product and add to cart
                    handleBarcodeDetected(barcode, format);
                  }
                  if (err && !(err instanceof NotFoundException) && !scannerProcessingRef.current) {
                    console.log('🔍 Scanner searching (fallback)...', err.message || 'Processing frame');
                    setScanningStatus('🔍 Scanning entire view for barcodes...');
                  }
                });
              }
              
              // Store the controls object for later use
              setScannerControls(controls);
              console.log('Scanner started successfully');
              setScanningStatus('📷 Camera ready - Scanning entire view for barcodes');
              
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
    setScannerProcessing(false);
    scannerProcessingRef.current = false;
    setLastDetectionTime(0);
    lastDetectionTimeRef.current = 0;
    setScanningStatus('Ready to scan entire view...');
    onScannerModalChange();
  };

  // Handle barcode detection
  const handleBarcodeDetected = (barcode: string, format: any) => {
    const currentTime = Date.now();
    
    // Prevent multiple detections while processing or within 1 second
    if (scannerProcessingRef.current || (currentTime - lastDetectionTimeRef.current < 1000)) {
      console.log('Scanner already processing or too soon, ignoring detection:', barcode, {
        processing: scannerProcessingRef.current,
        timeDiff: currentTime - lastDetectionTimeRef.current
      });
      return;
    }
    
    console.log('Searching for product with barcode:', barcode);
    
    // Find product by barcode or SKU
    const foundProduct = products.find(product => 
      product.barcode === barcode || product.sku === barcode
    );
    
    if (foundProduct) {
      console.log('Product found:', foundProduct);
      
      // IMMEDIATELY stop all scanner activity
      scannerProcessingRef.current = true;
      lastDetectionTimeRef.current = currentTime;
      setScannerProcessing(true);
      setLastDetectionTime(currentTime);
      
      // Stop the scanner controls and video stream immediately
      try {
        if (scannerControls && typeof scannerControls.stop === 'function') {
          scannerControls.stop();
        }
        
        // Also stop video tracks directly
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach(track => {
            track.stop();
            console.log('Stopped video track:', track.kind);
          });
        }
      } catch (error) {
        console.error('Error stopping scanner controls/video:', error);
      }
      
      // Update status before adding to cart
      setScanningStatus(`✅ Found: ${foundProduct.name} - Adding to cart...`);
      
      // Add to cart
      addToCart(foundProduct);
      
      successToast(`${foundProduct.name} added to cart! Scanner closed.`);
      
      // Complete the scanner shutdown with a small delay to ensure UI updates
      setTimeout(() => {
        stopScanning();
      }, 100);
    } else {
      console.log('No product found with barcode:', barcode);
      errorToast(`No product found with barcode: ${barcode}`);
      
      // Continue scanning for another barcode
      setScanningStatus('🔍 Product not found. Continue scanning...');
    }
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

  // Enhanced manual frame capture and scan
  const captureFrame = async () => {
    if (!videoRef.current || !scannerReader || scannerProcessingRef.current) {
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
          }
        } catch (e: any) {
          console.log('❌ Method 2 failed:', e.message);
        }
      }
      
      // Process results
      if (detectedBarcode) {
        console.log(`✅ Enhanced capture SUCCESS via ${successMethod}:`, detectedBarcode, 'Format:', detectedFormat);
        setScanningStatus(`✅ ${successMethod} scan: ${detectedBarcode}`);
        
        // Handle detected barcode
        handleBarcodeDetected(detectedBarcode, detectedFormat);
      } else {
        setScanningStatus('❌ No barcode found in frame. Try better lighting or different angle.');
        errorToast('No barcode detected in frame. Try better lighting, different angle, or move closer.');
      }
      
    } catch (error: any) {
      console.error('Enhanced capture error:', error);
      setScanningStatus('❌ Capture failed');
      errorToast(`Capture failed: ${error.message}`);
    } finally {
      setIsManualCapture(false);
    }
  };

  const getProductId = (product: Product) => {
    return product._id || product.id;
  };

  const addToCart = (product: Product) => {
    const productId = getProductId(product);
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      updateQuantity(productId, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId,
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'percentage'
      };

      setCart(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => getProductId(p) === productId);
    if (!product) return;

    if (newQuantity > product.stockQuantity) {
      errorToast(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const calculateCart = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    // Ensure cart.items exists and is an array
    if (!cart.items || !Array.isArray(cart.items)) {
      console.warn('Cart items is not a valid array:', cart.items);
      return;
    }

    cart.items.forEach(item => {
      // Validate item properties
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;

      const itemTotal = quantity * unitPrice;
      subtotal += itemTotal;

      // Calculate item discount
      if (discount > 0) {
        if (item.discountType === 'percentage') {
          totalDiscount += (itemTotal * discount) / 100;
        } else {
          totalDiscount += discount * quantity;
        }
      }
    });

    // Apply overall cart discount
    const discountVal = Number(discountValue) || 0;
    if (discountVal > 0) {
      if (discountType === 'percentage') {
        totalDiscount += (subtotal * discountVal) / 100;
      } else {
        totalDiscount += discountVal;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    const taxAmount = discountedSubtotal * getTaxRate();
    const totalAmount = discountedSubtotal + taxAmount;

    // Ensure all values are valid numbers
    const validSubtotal = Number(subtotal) || 0;
    const validTaxAmount = Number(taxAmount) || 0;
    const validDiscountAmount = Number(totalDiscount) || 0;
    const validTotalAmount = Number(totalAmount) || 0;

    console.log('Cart calculation:', {
      items: cart.items.length,
      subtotal: validSubtotal,
      taxAmount: validTaxAmount,
      discountAmount: validDiscountAmount,
      totalAmount: validTotalAmount
    });

    setCart(prev => ({
      ...prev,
      subtotal: validSubtotal,
      taxAmount: validTaxAmount,
      discountAmount: validDiscountAmount,
      totalAmount: validTotalAmount,
      customer: selectedCustomer || undefined
    }));
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0
    });
    setSelectedCustomer(null);
    setDiscountValue(0);
    setAmountReceived(0);
    setChange(0);
    setCompletedSale(null);
  };

  const processPayment = async () => {
    if (cart.items.length === 0) {
      errorToast('Cart is empty');
      return;
    }

    if (paymentMethod === 'cash' && amountReceived < cart.totalAmount) {
      errorToast('Insufficient payment amount');
      return;
    }

    if (!currentUser) {
      errorToast('User not authenticated');
      return;
    }

    try {
      setProcessingPayment(true);

      // Debug cart values
      console.log('Cart before payment:', cart);

      // Prepare sale data
      const saleData = {
        customerId: selectedCustomer?._id || selectedCustomer?.id,
        sellerId: currentUser._id || currentUser.id,
        items: cart.items.map(item => ({
          productId: item.product._id || item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          totalPrice: (item.quantity * item.unitPrice) - (
            item.discountType === 'percentage'
              ? (item.quantity * item.unitPrice * item.discount) / 100
              : item.discount * item.quantity
          )
        })),
        subtotal: cart.subtotal || 0,
        taxAmount: cart.taxAmount || 0,
        discountAmount: cart.discountAmount || 0,
        totalAmount: cart.totalAmount || 0,
        amountPaid: paymentMethod === 'cash' ? amountReceived : cart.totalAmount,
        changeAmount: paymentMethod === 'cash' ? change : 0,
        payments: [{
          method: paymentMethod,
          amount: paymentMethod === 'cash' ? amountReceived : cart.totalAmount,
          status: 'completed'
        }],
        source: 'pos',
        notes: `POS Sale - Payment: ${paymentMethod}`
      };

      console.log('Sale data being sent:', saleData);

      // Create the sale in the database
      const response = await salesAPI.create(saleData);
      console.log('Raw sale response:', response);
      
      const sale = (response as any)?.data || response;
      console.log('Extracted sale data:', sale);

      if (!sale || !sale.receiptNumber) {
        console.error('Invalid sale response - missing receipt number:', sale);
        errorToast('Failed to generate receipt number');
        return;
      }

      // Ensure the sale has all the necessary data for the receipt
      const completeSale = {
        ...sale,
        receiptNumber: sale.receiptNumber,
        items: sale.items || cart.items.map(cartItem => ({
          ...cartItem,
          product: cartItem.product,
          productId: cartItem.product
        })),
        subtotal: sale.subtotal || cart.subtotal,
        taxAmount: sale.taxAmount || cart.taxAmount,
        discountAmount: sale.discountAmount || cart.discountAmount,
        totalAmount: sale.totalAmount || cart.totalAmount,
        amountPaid: sale.amountPaid || (paymentMethod === 'cash' ? amountReceived : cart.totalAmount),
        createdAt: sale.createdAt || new Date().toISOString()
      };

      console.log('Complete sale data for receipt:', completeSale);
      setCompletedSale(completeSale);
      successToast('Payment processed successfully!');
      onPaymentModalChange();
      openReceiptModal();

      // Reload products to get updated stock quantities
      await loadData();

    } catch (error: any) {
      errorToast(error.message || 'Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      errorToast('First name and last name are required');
      return;
    }

    try {
      const customerData = {
        ...newCustomer,
        loyaltyPoints: 0,
        totalPurchases: 0,
        totalSpent: 0,
        isActive: true
      };

      const response = await customersAPI.create(customerData);
      const createdCustomer = (response as any)?.data || response;

      const customer: Customer = {
        ...createdCustomer,
        id: createdCustomer._id || createdCustomer.id,
        _id: createdCustomer._id || createdCustomer.id
      };

      setCustomers(prev => [...prev, customer]);
      setSelectedCustomer(customer);
      setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
      onCustomerModalChange();
      successToast('Customer created successfully');
    } catch (error: any) {
      errorToast(error.message || 'Failed to create customer');
      console.error('Error creating customer:', error);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.warn('formatCurrency received invalid amount:', amount);
      return store ? storeFormatCurrency(0) : `${CURRENCY}0.00`;
    }
    return store ? storeFormatCurrency(amount) : `${CURRENCY}${amount.toFixed(2)}`;
  };

  const printReceipt = () => {
    if (!completedSale) return;

    const receiptWindow = window.open('', '_blank', 'width=300,height=600');
    if (!receiptWindow) {
      errorToast('Unable to open print window. Please allow popups for this site.');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
            width: 280px;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-name { flex: 1; }
          .item-price { text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-label { font-weight: bold; }
          .total-amount { font-weight: bold; text-align: right; }
          @media print {
            body { width: auto; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center bold">
          <div>${store?.name || 'STORE RECEIPT'}</div>
          ${store?.receiptSettings?.headerText ? `<div>${store.receiptSettings.headerText}</div>` : ''}
          ${store?.receiptSettings?.showAddress && store?.address ? `<div>${store.address.street}, ${store.address.city}</div>` : ''}
          ${store?.receiptSettings?.showPhone && store?.phone ? `<div>${store.phone}</div>` : ''}
          ${store?.receiptSettings?.showEmail && store?.email ? `<div>${store.email}</div>` : ''}
          ${store?.receiptSettings?.showWebsite && store?.website ? `<div>${store.website}</div>` : ''}
        </div>
        <div class="line"></div>
        
        <div>Receipt #: ${completedSale.receiptNumber}</div>
        <div>Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}</div>
        ${selectedCustomer ? `<div>Customer: ${selectedCustomer.firstName} ${selectedCustomer.lastName}</div>` : '<div>Customer: Walk-in</div>'}
        <div>Cashier: ${currentUser?.firstName || 'N/A'} ${currentUser?.lastName || ''}</div>
        
        <div class="line"></div>
        
        <div class="bold">ITEMS:</div>
        ${completedSale.items?.map((item: any) => {
          // Try multiple ways to get the product name - be more thorough
          const productName = item.product?.name || 
                            item.productId?.name || 
                            cart.items.find(cartItem => cartItem.productId === item.productId || cartItem.productId === item.productId?._id)?.product?.name || 
                            'Unknown Item';
          const unitPrice = item.unitPrice || item.product?.price || 0;
          const quantity = item.quantity || 0;
          const itemTotal = quantity * unitPrice;
          
          return `
          <div class="item-row">
            <div class="item-name">${productName}</div>
          </div>
          <div class="item-row">
            <div>${quantity} x ${formatCurrency(unitPrice)}</div>
            <div class="item-price">${formatCurrency(itemTotal)}</div>
          </div>
        `;
        }).join('') || 'No items found'}
        
        <div class="line"></div>
        
        <div class="total-row">
          <div>Subtotal:</div>
          <div class="right">${formatCurrency(completedSale.subtotal)}</div>
        </div>
        
        ${completedSale.discountAmount > 0 ? `
          <div class="total-row">
            <div>Discount:</div>
            <div class="right">-${formatCurrency(completedSale.discountAmount)}</div>
          </div>
        ` : ''}
        
        ${getTaxRate() > 0 ? `
        <div class="total-row">
          <div>${store?.taxSettings?.name || 'Tax'} (${(getTaxRate() * 100).toFixed(0)}%):</div>
          <div class="right">${formatCurrency(completedSale.taxAmount)}</div>
        </div>` : ''}
        
        <div class="line"></div>
        
        <div class="total-row bold">
          <div class="total-label">TOTAL:</div>
          <div class="total-amount">${formatCurrency(completedSale.totalAmount)}</div>
        </div>
        
        <div class="total-row">
          <div>Payment (${paymentMethod === 'cash' ? 'Cash' : 'Mobile Money'}):</div>
          <div class="right">${formatCurrency(completedSale.amountPaid)}</div>
        </div>
        
        ${paymentMethod === 'cash' && change > 0 ? `
          <div class="total-row">
            <div>Change:</div>
            <div class="right">${formatCurrency(change)}</div>
          </div>
        ` : ''}
        
        <div class="line"></div>
        
        <div class="center">
          <div>${store?.receiptSettings?.footerText || 'Thank you for your business!'}</div>
          <div>Please come again</div>
        </div>
        
        <div class="center no-print" style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px;">Print Receipt</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();

    // Auto-focus the print window
    receiptWindow.focus();

    // Optional: Auto-print after a short delay
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
            {store && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isStoreOpen() ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${isStoreOpen() ? 'text-green-600' : 'text-red-600'}`}>
                  {isStoreOpen() ? 'Open' : 'Closed'}
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Process sales transactions and manage the cash register
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedCustomer && (
            <Chip
              color="primary"
              variant="flat"
              startContent={<User className="w-4 h-4" />}
              onClose={() => setSelectedCustomer(null)}
            >
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </Chip>
          )}
          <Button
            color="secondary"
            variant="bordered"
            startContent={isScanning ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            onClick={isScanning ? stopScanning : startScanning}
          >
            {isScanning ? 'Stop Scan' : 'Scan Product'}
          </Button>
          <Button
            color="primary"
            variant="ghost"
            startContent={<User className="w-4 h-4" />}
            onClick={openCustomerModal}
          >
            {selectedCustomer ? 'Change Customer' : 'Select Customer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}

          <div className="flex gap-2">
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              size="lg"
              className="flex-1"
            />
            <Button
              color="secondary"
              variant="bordered"
              size="lg"
              onClick={isScanning ? stopScanning : startScanning}
              startContent={isScanning ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              className="px-6"
            >
              {isScanning ? 'Stop' : 'Scan'}
            </Button>
          </div>


          {/* Products Grid */}
          <div style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: ' transparent',
            scrollbarGutter: 'stable',
          }} className="grid grid-cols-2 mt-4 md:grid-cols-2 lg:grid-cols-5 gap-2">


            {filteredProducts.map((product) => (
              <div
                key={getProductId(product)}
                className=""
                onClick={() => addToCart(product)}
              >
                <div className="relative md:h-40 md:w-40  overflow-hidden rounded-xl bg-gray-100 dark:bg-[#18181c] aspect-square group-hover:shadow-lg transition-shadow duration-200">
                  {product.images && product.images.length > 0 ? (

                    <img
                      src={product.images[0]}
                      alt={product.name}
                     
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tag className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="p-2 ">

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white/70 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
                  <p className="text-md font-medium font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-gray-500">Stock: {product.stockQuantity}</p>
                </div>
              </div>

            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2" />
              <p>No products found</p>
            </div>
          )}

        </div>

        {/* Cart and Payment Area */}
        <div className="space-y-4">
          {/* Cart */}
          <Card className="customed-dark-card !shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart ({cart.items.length})
                </h3>
                {cart.items.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="danger"
                    onClick={clearCart}
                    startContent={<Trash2 className="w-4 h-4" />}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div style={{
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
                scrollbarColor: 'gray transparent',
                scrollbarGutter: 'stable',
              }} className="space-y-3 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-2  rounded-lg border border-black/20 dark:border-white/20">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        isIconOnly
                        variant="ghost"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>

                      <Button
                        size="sm"
                        isIconOnly
                        variant="ghost"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        isIconOnly
                        variant="ghost"
                        color="danger"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p>Cart is empty</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Cart Summary */}
          {cart.items.length > 0 && (
            <Card className="customed-dark-card">
              <CardBody className="p-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>

                {/* Discount Input */}
                <div className="space-y-2 mb-4">
                  <div className="flex space-x-2">
                    <Select
                      size="sm"
                      selectedKeys={[discountType]}
                      onSelectionChange={(keys) => setDiscountType(Array.from(keys)[0] as 'percentage' | 'fixed')}
                      className="w-24"
                      classNames={{
                        trigger: ' border border-black/20 dark:border-white/20',
                        popoverContent: 'bg-gray-50 dark:bg-gray-800 border border-black/20 dark:border-white/20',
                      }}
                    >
                      <SelectItem key="percentage">%</SelectItem>
                      <SelectItem key="fixed">{CURRENCY}</SelectItem>
                    </Select>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Discount"
                      value={discountValue.toString()}
                      onValueChange={(value) => setDiscountValue(parseFloat(value) || 0)}
                      startContent={<Percent className="w-4 h-4" />}
                      classNames={{
                        inputWrapper: ' border border-black/20 dark:border-white/20',
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>

                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount:</span>
                      <span>-{formatCurrency(cart.discountAmount)}</span>
                    </div>
                  )}

                  {getTaxRate() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{store?.taxSettings?.name || 'Tax'} ({(getTaxRate() * 100).toFixed(0)}%):</span>
                      <span>{formatCurrency(cart.taxAmount)}</span>
                    </div>
                  )}

                  <Divider />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(cart.totalAmount)}</span>
                  </div>
                </div>

                <Button
                  color="primary"
                  size="md"
                  className="w-full mt-4"
                  onClick={openPaymentModal}
                  startContent={<CreditCard className="w-4 h-4" />}
                >
                  Process Payment
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Modal className='customed-dark-card' backdrop="blur" isOpen={isCustomerModalOpen} onOpenChange={onCustomerModalChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Select Customer</ModalHeader>
              <ModalBody>
                <Tabs classNames={{
                  tabList: 'customed-dark-card',
                }}>
                  <Tab key="existing" title="Existing Customers">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      <div
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => {
                          setSelectedCustomer(null);
                          onClose();
                        }}
                      >
                        <div className="flex items-center">
                          <Avatar size="sm" className="mr-3" />
                          <div>
                            <p className="font-medium">Walk-in Customer</p>
                            <p className="text-sm text-gray-500">No customer information</p>
                          </div>
                        </div>
                      </div>

                      {customers.map((customer) => (
                        <div
                          key={customer._id || customer.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            onClose();
                          }}
                        >
                          <div className="flex items-center">
                            <Avatar size="sm" className="mr-3" />
                            <div>
                              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                              <p className="text-sm text-gray-500">{customer.email || customer.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Tab>

                  <Tab key="new" title="New Customer">
                    <div className="space-y-4 flex flex-col gap-2">
                      <div className="grid grid-cols-2  gap-4">
                        <CustomInput
                          label="First Name"
                          placeholder="Enter first name"
                          value={newCustomer.firstName}
                          onChange={(value) => setNewCustomer(prev => ({ ...prev, firstName: value }))}
                          required
                        />
                        <CustomInput
                          label="Last Name"
                          placeholder="Enter last name"
                          value={newCustomer.lastName}
                          onChange={(value) => setNewCustomer(prev => ({ ...prev, lastName: value }))}
                          required
                        />
                      </div>

                      <CustomInput
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        value={newCustomer.email}
                        onChange={(value) => setNewCustomer(prev => ({ ...prev, email: value }))}
                      />

                      <CustomInput
                        label="Phone"
                        placeholder="Enter phone number"
                        value={newCustomer.phone}
                        onChange={(value) => setNewCustomer(prev => ({ ...prev, phone: value }))}
                      />

                      <Button
                        color="primary"
                        onClick={createCustomer}
                        startContent={<UserPlus className="w-4 h-4" />}
                      >
                        Create Customer
                      </Button>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Payment Modal */}
      <Modal className='customed-dark-card' backdrop="blur" isOpen={isPaymentModalOpen} onOpenChange={onPaymentModalChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Process Payment</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  {/* Order Summary */}
                  <div className="p-4 customed-dark-card rounded-lg">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(cart.subtotal)}</span>
                      </div>
                      {cart.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(cart.discountAmount)}</span>
                        </div>
                      )}
                      {getTaxRate() > 0 && (
                        <div className="flex justify-between">
                          <span>{store?.taxSettings?.name || 'Tax'}:</span>
                          <span>{formatCurrency(cart.taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(cart.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className='mt-2'>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'solid' : 'bordered'}
                        color={paymentMethod === 'cash' ? 'primary' : 'default'}
                        onClick={() => setPaymentMethod('cash')}
                        startContent={<Banknote className="w-4 h-4" />}
                      >
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === 'mobile_money' ? 'solid' : 'bordered'}
                        color={paymentMethod === 'mobile_money' ? 'primary' : 'default'}
                        onClick={() => setPaymentMethod('mobile_money')}
                        startContent={<Smartphone className="w-4 h-4" />}
                      >
                        Mobile Money
                      </Button>
                    </div>
                  </div>

                  {/* Cash Payment Details */}
                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 !mt-2">
                      <CustomInput

                        label="Amount Received"
                        type="number"
                        placeholder="0.00"
                        value={amountReceived.toString()}
                        onChange={(value) => setAmountReceived(parseFloat(value) || 0)}
                        min="0"
                        step="0.01"

                      />

                      {change > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-800 dark:text-green-200">Change:</span>
                            <span className="text-xl font-bold text-green-800 dark:text-green-200">
                              {formatCurrency(change)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          cart.totalAmount || 0,
                          Math.ceil((cart.totalAmount || 0) / 5) * 5,
                          Math.ceil((cart.totalAmount || 0) / 10) * 10,
                          Math.ceil((cart.totalAmount || 0) / 20) * 20
                        ].filter(amount => amount > 0).map((amount) => (
                          <Button
                            key={amount}
                            size="sm"
                            variant="bordered"
                            onClick={() => setAmountReceived(amount)}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={processPayment}
                  isLoading={processingPayment}
                  isDisabled={
                    (paymentMethod === 'cash' && amountReceived < cart.totalAmount) ||
                    cart.items.length === 0
                  }
                  startContent={!processingPayment && <Check className="w-4 h-4" />}
                >
                  {processingPayment ? 'Processing...' : 'Complete Payment'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Receipt Modal */}
      <Modal className='customed-dark-card' backdrop="blur" isOpen={isReceiptModalOpen} onOpenChange={onReceiptModalChange} size="md" isDismissable={false}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Payment Successful</ModalHeader>
              <ModalBody>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Payment Completed!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Transaction processed successfully
                    </p>
                  </div>

                  {completedSale && (
                    <div className="p-4 customed-dark-card rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Receipt #:</span>
                          <span className="font-medium">{completedSale.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Paid:</span>
                          <span className="font-medium">{formatCurrency(completedSale.totalAmount)}</span>
                        </div>
                        {paymentMethod === 'cash' && change > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Change Given:</span>
                            <span className="font-medium">{formatCurrency(change)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="font-medium capitalize">{paymentMethod === 'mobile_money' ? 'Mobile Money' : paymentMethod}</span>
                        </div>
                        {selectedCustomer && (
                          <div className="flex justify-between">
                            <span>Customer:</span>
                            <span className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="secondary"
                  onClick={printReceipt}
                  startContent={<Receipt className="w-4 h-4" />}
                >
                  Print Receipt
                </Button>
                <Button
                  color="primary"
                  onClick={() => {
                    onClose();
                    clearCart();
                  }}
                >
                  New Sale
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal className='customed-dark-card' backdrop="blur" isOpen={isScannerModalOpen} onOpenChange={onScannerModalChange} size="2xl" isDismissable={false}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center justify-between w-full">
                  <span>Barcode Scanner</span>
                  <Button
                    variant="ghost"
                    onClick={stopScanning}
                    className="min-w-unit-8 w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                                     {/* Video Preview */}
                   <div className="relative">
                     <video
                       ref={videoRef}
                       className="w-full h-80 bg-black rounded-lg border border-gray-300 dark:border-gray-600"
                       autoPlay
                       playsInline
                       muted
                     />
                     {/* Scanner Frame Overlay - Visual Guide Only */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-60 h-40 border-2 border-blue-500 rounded-lg opacity-30">
                         <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                         <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                         <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                         <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                       </div>
                     </div>
                     {/* Full Screen Scanning Indicator */}
                     <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                       📱 Scanning entire view
                     </div>
                   </div>

                  {/* Scanner Controls */}
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
                       disabled={isManualCapture || scannerProcessing}
                     >
                       {isManualCapture ? 'Scanning...' : scannerProcessing ? 'Processing...' : 'Capture Frame'}
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

                                     {/* Scanner Status */}
                   <div className="text-center space-y-2">
                     <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                       {scanningStatus}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       📱 Scans anywhere in camera view • 🎯 Frame is just a guide • 💡 Good lighting helps • ⚡ Auto-closes when found
                     </p>
                   </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 