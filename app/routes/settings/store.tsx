import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Spinner,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Divider,
  Tabs,
  Tab,
  Chip
} from "@heroui/react";
import { Store, Clock, Receipt, Bell, Share2, Save, AlertCircle } from 'lucide-react';
import { storeAPI } from '../../utils/api';
import { errorToast, successToast } from '../../components/toast';

const StoreSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Ghana'
    },
    businessRegistration: '',
    taxId: '',
    businessType: 'retail',
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
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getStore() as any;
      if (response.success && response.data) {
        setStoreData(response.data);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      // Don't show error toast on 404 - it just means no store is set up yet
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setStoreData(prev => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setHasChanges(true);
  };

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    setStoreData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await storeAPI.updateStore(storeData) as any;
      if (response.success) {
        successToast('Store information updated successfully!');
        setHasChanges(false);
      } else {
        errorToast('Failed to update store information');
      }
    } catch (error) {
      console.error('Error saving store data:', error);
      errorToast('Failed to update store information');
    } finally {
      setSaving(false);
    }
  };

  const businessTypeOptions = [
    { key: 'retail', label: 'Retail' },
    { key: 'wholesale', label: 'Wholesale' },
    { key: 'both', label: 'Both Retail & Wholesale' },
    { key: 'service', label: 'Service' },
    { key: 'other', label: 'Other' }
  ];

  const currencyOptions = [
    { key: 'GHS', label: 'GHS - Ghana Cedi' },
    { key: 'USD', label: 'USD - US Dollar' },
    { key: 'EUR', label: 'EUR - Euro' },
    { key: 'GBP', label: 'GBP - British Pound' },
    { key: 'NGN', label: 'NGN - Nigerian Naira' }
  ];

  const timezoneOptions = [
    { key: 'Africa/Accra', label: 'Africa/Accra (GMT)' },
    { key: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
    { key: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { key: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { key: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' }
  ];

  const dateFormatOptions = [
    { key: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { key: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { key: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Store Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your store information and business details
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Chip size="sm" color="warning" variant="flat">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved changes
            </Chip>
          )}
          <Button
            color="primary"
            onClick={handleSave}
            isLoading={saving}
            startContent={<Save className="w-4 h-4" />}
            isDisabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-[#22d3ee]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-[#06b6d4]"
            }}
          >
            {/* Basic Information Tab */}
            <Tab
              key="basic"
              title={
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4" />
                  <span>Basic Information</span>
                </div>
              }
            >
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Store Name"
                    placeholder="Enter your store name"
                    value={storeData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="store@example.com"
                    value={storeData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Phone"
                    placeholder="+233 XXX XXX XXXX"
                    value={storeData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Website"
                    placeholder="https://yourstore.com"
                    value={storeData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
                
                <Textarea
                  label="Description"
                  placeholder="Brief description of your store"
                  value={storeData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Street Address"
                      placeholder="123 Main Street"
                      value={storeData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      isRequired
                    />
                    <Input
                      label="City"
                      placeholder="Accra"
                      value={storeData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      isRequired
                    />
                    <Input
                      label="State/Region"
                      placeholder="Greater Accra"
                      value={storeData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      isRequired
                    />
                    <Input
                      label="Postal Code"
                      placeholder="00233"
                      value={storeData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      isRequired
                    />
                    <Input
                      label="Country"
                      placeholder="Ghana"
                      value={storeData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      isRequired
                    />
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Business Type"
                      selectedKeys={storeData.businessType ? [storeData.businessType] : []}
                      onSelectionChange={(keys) => handleInputChange('businessType', Array.from(keys)[0])}
                    >
                      {businessTypeOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Business Registration Number"
                      placeholder="Enter registration number"
                      value={storeData.businessRegistration}
                      onChange={(e) => handleInputChange('businessRegistration', e.target.value)}
                    />
                    <Input
                      label="Tax ID"
                      placeholder="Enter tax identification number"
                      value={storeData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Tab>

            {/* Operating Hours Tab */}
            <Tab
              key="hours"
              title={
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Operating Hours</span>
                </div>
              }
            >
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
                  <div className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-24">
                          <span className="font-medium capitalize">{day}</span>
                        </div>
                        <Switch
                          isSelected={!storeData.operatingHours[day].isClosed}
                          onValueChange={(value) => handleOperatingHoursChange(day, 'isClosed', !value)}
                          size="sm"
                        >
                          Open
                        </Switch>
                        {!storeData.operatingHours[day].isClosed && (
                          <>
                            <Input
                              type="time"
                              label="Open"
                              value={storeData.operatingHours[day].open}
                              onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                              className="w-32"
                            />
                            <Input
                              type="time"
                              label="Close"
                              value={storeData.operatingHours[day].close}
                              onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </>
                        )}
                        {storeData.operatingHours[day].isClosed && (
                          <span className="text-gray-500">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Currency"
                      selectedKeys={storeData.currency ? [storeData.currency] : []}
                      onSelectionChange={(keys) => handleInputChange('currency', Array.from(keys)[0])}
                    >
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Timezone"
                      selectedKeys={storeData.timezone ? [storeData.timezone] : []}
                      onSelectionChange={(keys) => handleInputChange('timezone', Array.from(keys)[0])}
                    >
                      {timezoneOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Date Format"
                      selectedKeys={storeData.dateFormat ? [storeData.dateFormat] : []}
                      onSelectionChange={(keys) => handleInputChange('dateFormat', Array.from(keys)[0])}
                    >
                      {dateFormatOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </Tab>

            {/* Receipt Settings Tab */}
            <Tab
              key="receipt"
              title={
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4" />
                  <span>Receipt Settings</span>
                </div>
              }
            >
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Receipt Display Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Show Logo</span>
                        <p className="text-sm text-gray-500">Display store logo on receipts</p>
                      </div>
                      <Switch
                        isSelected={storeData.receiptSettings.showLogo}
                        onValueChange={(value) => handleInputChange('receiptSettings.showLogo', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Show Address</span>
                        <p className="text-sm text-gray-500">Display store address on receipts</p>
                      </div>
                      <Switch
                        isSelected={storeData.receiptSettings.showAddress}
                        onValueChange={(value) => handleInputChange('receiptSettings.showAddress', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Show Phone</span>
                        <p className="text-sm text-gray-500">Display phone number on receipts</p>
                      </div>
                      <Switch
                        isSelected={storeData.receiptSettings.showPhone}
                        onValueChange={(value) => handleInputChange('receiptSettings.showPhone', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Show Email</span>
                        <p className="text-sm text-gray-500">Display email address on receipts</p>
                      </div>
                      <Switch
                        isSelected={storeData.receiptSettings.showEmail}
                        onValueChange={(value) => handleInputChange('receiptSettings.showEmail', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Show Website</span>
                        <p className="text-sm text-gray-500">Display website URL on receipts</p>
                      </div>
                      <Switch
                        isSelected={storeData.receiptSettings.showWebsite}
                        onValueChange={(value) => handleInputChange('receiptSettings.showWebsite', value)}
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Receipt Messages</h3>
                  <div className="space-y-4">
                    <Input
                      label="Header Text"
                      placeholder="Optional message at the top of receipts"
                      value={storeData.receiptSettings.headerText}
                      onChange={(e) => handleInputChange('receiptSettings.headerText', e.target.value)}
                    />
                    <Textarea
                      label="Footer Text"
                      placeholder="Thank you message at the bottom of receipts"
                      value={storeData.receiptSettings.footerText}
                      onChange={(e) => handleInputChange('receiptSettings.footerText', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </Tab>

            {/* Notifications Tab */}
            <Tab
              key="notifications"
              title={
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
              }
            >
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Alert Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Low Stock Alerts</span>
                        <p className="text-sm text-gray-500">Get notified when products are running low</p>
                      </div>
                      <Switch
                        isSelected={storeData.notifications.lowStockAlert}
                        onValueChange={(value) => handleInputChange('notifications.lowStockAlert', value)}
                      />
                    </div>
                    {storeData.notifications.lowStockAlert && (
                      <Input
                        type="number"
                        label="Low Stock Threshold"
                        placeholder="10"
                        value={storeData.notifications.lowStockThreshold.toString()}
                        onChange={(e) => handleInputChange('notifications.lowStockThreshold', parseInt(e.target.value))}
                        className="ml-4"
                      />
                    )}
                  </div>
                </div>

                <Divider />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Report Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Daily Reports</span>
                        <p className="text-sm text-gray-500">Receive daily sales and inventory reports</p>
                      </div>
                      <Switch
                        isSelected={storeData.notifications.dailyReports}
                        onValueChange={(value) => handleInputChange('notifications.dailyReports', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Weekly Reports</span>
                        <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                      </div>
                      <Switch
                        isSelected={storeData.notifications.weeklyReports}
                        onValueChange={(value) => handleInputChange('notifications.weeklyReports', value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">Monthly Reports</span>
                        <p className="text-sm text-gray-500">Receive monthly analytics reports</p>
                      </div>
                      <Switch
                        isSelected={storeData.notifications.monthlyReports}
                        onValueChange={(value) => handleInputChange('notifications.monthlyReports', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            {/* Social Media Tab */}
            <Tab
              key="social"
              title={
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Social Media</span>
                </div>
              }
            >
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Facebook"
                      placeholder="https://facebook.com/yourstore"
                      value={storeData.socialMedia.facebook}
                      onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                    />
                    <Input
                      label="Twitter"
                      placeholder="https://twitter.com/yourstore"
                      value={storeData.socialMedia.twitter}
                      onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                    />
                    <Input
                      label="Instagram"
                      placeholder="https://instagram.com/yourstore"
                      value={storeData.socialMedia.instagram}
                      onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                    />
                    <Input
                      label="LinkedIn"
                      placeholder="https://linkedin.com/company/yourstore"
                      value={storeData.socialMedia.linkedin}
                      onChange={(e) => handleInputChange('socialMedia.linkedin', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default StoreSettingsPage; 