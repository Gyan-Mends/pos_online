import { useState, useEffect, createContext, useContext } from 'react';
import { storeAPI } from '../utils/api';

interface StoreInfo {
  _id?: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessRegistration?: string;
  taxId?: string;
  businessType?: string;
  operatingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  currency: string;
  timezone: string;
  dateFormat: string;
  receiptSettings: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    footerText?: string;
    headerText?: string;
  };
  notifications: {
    lowStockAlert: boolean;
    lowStockThreshold: number;
    dailyReports: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  taxSettings?: {
    rate: number;
    type: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface StoreContextType {
  store: StoreInfo | null;
  loading: boolean;
  error: string | null;
  refreshStore: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  isStoreOpen: (date?: Date) => boolean;
  getBusinessHours: (day?: string) => { open: string; close: string; isClosed: boolean } | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const useStoreData = () => {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStore = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeAPI.getStore() as any;
      if (response.success && response.data) {
        setStore(response.data);
      } else {
        // Set default store data if none exists
        setStore({
          name: 'Your Store Name',
          email: 'store@example.com',
          phone: '+233 XXX XXX XXXX',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Ghana'
          },
          operatingHours: {
            monday: { open: '08:00', close: '18:00', isClosed: false },
            tuesday: { open: '08:00', close: '18:00', isClosed: false },
            wednesday: { open: '08:00', close: '18:00', isClosed: false },
            thursday: { open: '08:00', close: '18:00', isClosed: false },
            friday: { open: '08:00', close: '18:00', isClosed: false },
            saturday: { open: '08:00', close: '18:00', isClosed: false },
            sunday: { open: '10:00', close: '16:00', isClosed: true }
          },
          currency: 'GHS',
          timezone: 'Africa/Accra',
          dateFormat: 'DD/MM/YYYY',
          receiptSettings: {
            showLogo: true,
            showAddress: true,
            showPhone: true,
            showEmail: true,
            showWebsite: false,
            footerText: 'Thank you for your business!',
            headerText: ''
          },
          notifications: {
            lowStockAlert: true,
            lowStockThreshold: 10,
            dailyReports: true,
            weeklyReports: true,
            monthlyReports: false
          },
          taxSettings: {
            rate: 0.15,
            type: 'percentage'
          }
        });
      }
    } catch (err) {
      console.error('Error loading store data:', err);
      setError('Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  const refreshStore = async () => {
    await loadStore();
  };

  const formatCurrency = (amount: number): string => {
    const currency = store?.currency || 'GHS';
    const currencyMap: { [key: string]: { code: string; locale: string } } = {
      GHS: { code: 'GHS', locale: 'en-GH' },
      USD: { code: 'USD', locale: 'en-US' },
      EUR: { code: 'EUR', locale: 'en-EU' },
      GBP: { code: 'GBP', locale: 'en-GB' },
      NGN: { code: 'NGN', locale: 'en-NG' }
    };

    const currencyInfo = currencyMap[currency] || currencyMap.GHS;
    
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.code,
    }).format(amount || 0);
  };

  const formatDate = (date: string | Date): string => {
    const dateFormat = store?.dateFormat || 'DD/MM/YYYY';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (dateFormat) {
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      case 'DD/MM/YYYY':
      default:
        return dateObj.toLocaleDateString('en-GB');
    }
  };

  const isStoreOpen = (date: Date = new Date()): boolean => {
    if (!store) return false;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()] as keyof typeof store.operatingHours;
    const dayHours = store.operatingHours[dayName];
    
    if (dayHours.isClosed) return false;
    
    const currentTime = date.getHours() * 100 + date.getMinutes();
    const openTime = parseInt(dayHours.open.replace(':', ''));
    const closeTime = parseInt(dayHours.close.replace(':', ''));
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getBusinessHours = (day?: string) => {
    if (!store) return null;
    
    const currentDay = day || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    return store.operatingHours[currentDay as keyof typeof store.operatingHours] || null;
  };

  useEffect(() => {
    loadStore();
  }, []);

  return {
    store,
    loading,
    error,
    refreshStore,
    formatCurrency,
    formatDate,
    isStoreOpen,
    getBusinessHours
  };
};

export { StoreContext };
export type { StoreInfo, StoreContextType }; 