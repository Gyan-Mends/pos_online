import { useEffect, useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Select,
  SelectItem,
  Input,
  Spinner
} from "@heroui/react";
import { 
  RefreshCwIcon, 
  ShieldIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  InfoIcon,
  EyeIcon,
  UserIcon,
  XCircleIcon,
  FilterIcon
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { auditAPI } from '../../utils/api';
import { successToast, errorToast } from '../../components/toast';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

interface AuditLog {
  _id: string;
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'warning' | 'error' | 'info';
  sessionId?: string;
  source: 'pos' | 'web' | 'mobile' | 'api' | 'system';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // Check current user role for debugging
      const userData = localStorage.getItem('user');
      let currentUser = null;
      if (userData) {
        try {
          currentUser = JSON.parse(userData);
          console.log('Current user:', currentUser);
          console.log('Current user role:', currentUser.role);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
      const params: any = {};
      
      if (filterAction) params.action = filterAction;
      if (filterResource) params.resource = filterResource;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      console.log('Loading audit logs with params:', params);
      
      const response = await auditAPI.getAll(params) as any;
      console.log('Raw audit API response:', response);
      
      const logs = response?.data || response || [];
      console.log('Processed logs:', logs);
      
      // Check if access was denied
      if (response?.success === false && response?.message?.includes('Access denied')) {
        console.warn('Access denied to audit logs - user role:', currentUser?.role);
        errorToast(`Access denied: ${response.message}`);
        setAuditLogs([]);
        return;
      }
      
      // Ensure logs is an array
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
        console.log('Set audit logs:', logs.length, 'items');
      } else {
        console.warn('Expected array of audit logs, got:', logs);
        setAuditLogs([]);
        errorToast('Invalid data format received from server');
      }
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Check if it's an access denied error
      if (error.response?.status === 403) {
        errorToast('Access denied: Admin privileges required to view audit logs');
        setAuditLogs([]);
        return;
      }
      
      // For testing purposes, add some mock data if API fails
      const mockData: AuditLog[] = [
        {
          _id: '1',
          id: '1',
          userId: 'user1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          action: 'login',
          resource: 'user',
          resourceId: 'user1',
          details: { loginMethod: 'email' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          severity: 'low',
          status: 'success',
          source: 'web',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          id: '2',
          userId: 'user1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          action: 'product_created',
          resource: 'product',
          resourceId: 'prod1',
          details: { productName: 'Test Product' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          severity: 'medium',
          status: 'success',
          source: 'pos',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setAuditLogs(mockData);
      console.log('Using mock data for testing');
      errorToast(error.message || 'Failed to load audit logs - using test data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Handle filter
  const handleFilter = async () => {
    setFilterLoading(true);
    try {
      await loadAuditLogs();
      onFilterClose();
      successToast('Filters applied successfully');
    } catch (error) {
      // Error already handled in loadAuditLogs
    } finally {
      setFilterLoading(false);
    }
  };

  // Clear filters
  const clearFilters = async () => {
    try {
      setFilterAction('');
      setFilterResource('');
      setFilterSeverity('');
      setFilterStatus('');
      setStartDate('');
      setEndDate('');
      await loadAuditLogs();
      successToast('Filters cleared');
    } catch (error) {
      // Error already handled in loadAuditLogs
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  // Format action
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'info': return 'primary';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-4 h-4" />;
      case 'warning': return <AlertTriangleIcon className="w-4 h-4" />;
      case 'error': return <XCircleIcon className="w-4 h-4" />;
      case 'info': return <InfoIcon className="w-4 h-4" />;
      default: return <InfoIcon className="w-4 h-4" />;
    }
  };

  // Get resource icon
  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'user': return <UserIcon className="w-4 h-4" />;
      case 'security': return <ShieldIcon className="w-4 h-4" />;
      default: return <InfoIcon className="w-4 h-4" />;
    }
  };

  // Get activity description based on log data
  const getActivityDescription = (log: AuditLog) => {
    // First check if we have a pre-computed description
    if (log.details?.actionDescription) {
      return log.details.actionDescription;
    }

    // Fallback to generating description based on action and resource
    switch (log.action) {
      case 'page_visited':
        return log.details?.pageName || `Visited ${log.resourceId || 'Unknown Page'}`;
      case 'login':
        return 'User logged into the system';
      case 'logout':
        return 'User logged out of the system';
      case 'product_added_to_cart':
        return `Added ${log.details?.productName || 'product'} to cart`;
      case 'sale_completed':
        return `Completed sale #${log.details?.receiptNumber || 'Unknown'}`;
      case 'cart_cleared':
        return 'Cleared shopping cart';
      default:
        return log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get activity subtext with additional context
  const getActivitySubtext = (log: AuditLog) => {
    switch (log.action) {
      case 'page_visited':
        const previousPage = log.details?.previousPageName;
        return previousPage && previousPage !== 'Direct Access' 
          ? `From: ${previousPage}` 
          : `Path: ${log.details?.pathname || log.resourceId || 'unknown'}`;
      case 'login':
        return `Method: ${log.details?.loginMethod || 'Unknown'}`;
      case 'logout':
        const duration = log.details?.sessionDuration;
        return duration ? `Session: ${Math.round(duration / 1000)}s` : 'Session ended';
      case 'product_added_to_cart':
        return `Qty: ${log.details?.quantity || 1}, Price: ${log.details?.price || 'N/A'}`;
      case 'sale_completed':
        return `Total: ${log.details?.totalAmount || 'N/A'}, Items: ${log.details?.itemCount || 0}`;
      case 'cart_cleared':
        return `${log.details?.itemCount || 0} items, Total: ${log.details?.cartTotal || 'N/A'}`;
      default:
        return log.details?.pathname || log.resourceId || `${log.resource} activity`;
    }
  };

  // Define columns for DataTable
  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      title: 'Timestamp',
      sortable: true,
      width: '180px',
      render: (value) => (
        <div className="text-sm">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'user',
      title: 'User',
      sortable: false,
      searchable: true,
      width: '200px',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Avatar
            src={record.user?.avatar}
            name={record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown'}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium">
              {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500">
              {record.user?.email || 'No email'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      title: 'Activity',
      sortable: true,
      searchable: true,
      width: '400px',
      render: (value, record) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white mb-1">
            {getActivityDescription(record)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">
            {getActivitySubtext(record)}
          </div>
        </div>
      )
    },
    {
      key: 'resource',
      title: 'Resource',
      sortable: true,
      searchable: true,
      width: '120px',
      render: (value) => (
        <Chip
          size="sm"
          color="default"
          variant="flat"
        >
          {value}
        </Chip>
      )
    },
    {
      key: 'severity',
      title: 'Severity',
      sortable: true,
      width: '100px',
      render: (value) => (
        <Chip
          size="sm"
          color={getSeverityColor(value) as any}
          variant="flat"
        >
          {value}
        </Chip>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '120px',
      render: (value) => (
        <div className="flex items-center space-x-1">
          {getStatusIcon(value)}
          <Chip
            size="sm"
            color={getStatusColor(value) as any}
            variant="flat"
          >
            {value}
          </Chip>
        </div>
      )
    },
    {
      key: 'source',
      title: 'Source',
      sortable: true,
      width: '100px',
      render: (value) => (
        <Chip
          size="sm"
          color="default"
          variant="flat"
        >
          {value}
        </Chip>
      )
    },
    {
      key: '_id',
      title: 'Actions',
      sortable: false,
      width: '100px',
      align: 'center',
      render: (value, record) => (
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<EyeIcon className="w-4 h-4" />}
          onClick={() => {
            setSelectedLog(record);
            onDetailOpen();
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Trail
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            System activity logs and user actions tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCwIcon className="w-4 h-4" />}
            onClick={loadAuditLogs}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            color="warning"
            variant="bordered"
            size="sm"
            onClick={async () => {
              try {
                const userData = localStorage.getItem('user');
                const user = userData ? JSON.parse(userData) : null;
                if (!user) {
                  errorToast('No user found');
                  return;
                }
                
                const testLog = {
                  userId: user._id || user.id,
                  action: 'page_visited',
                  resource: 'navigation',
                  resourceId: '/audit',
                  details: {
                    pageName: 'Audit Trail',
                    pathname: '/audit',
                    testLog: true,
                    timestamp: new Date().toISOString()
                  },
                  severity: 'low',
                  status: 'success',
                  source: 'web'
                };
                
                console.log('🧪 Creating test audit log:', testLog);
                const response = await auditAPI.create(testLog);
                console.log('✅ Test audit log response:', response);
                successToast('Test audit log created!');
                await loadAuditLogs();
              } catch (error: any) {
                console.error('❌ Test audit log failed:', error);
                errorToast('Test failed: ' + (error.message || 'Unknown error'));
              }
            }}
          >
            🧪 Test
          </Button>
          <Button
            color="secondary"
            variant="flat"
            startContent={<FilterIcon className="w-4 h-4" />}
            onClick={onFilterOpen}
          >
            Filter
          </Button>
          <Button
            color="default"
            variant="flat"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.length.toLocaleString()}
                </p>
              </div>
              <InfoIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Security Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.filter(log => log.resource === 'security' || log.severity === 'critical').length}
                </p>
              </div>
              <ShieldIcon className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.filter(log => log.severity === 'critical' || log.status === 'error').length}
                </p>
              </div>
              <AlertTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.length > 0 
                    ? Math.round((auditLogs.filter(log => log.status === 'success').length / auditLogs.length) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Audit Logs DataTable */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Check your API connection or try refreshing the page
            </p>
          </div>
        ) : (
          <>
            <DataTable
              data={auditLogs}
              columns={columns}
              loading={loading}
              pageSize={20}
              searchPlaceholder="Search audit logs..."
              emptyText="No audit logs found"
              showSearch={true}
              showPagination={true}
            />
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {auditLogs.length} audit log{auditLogs.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* Filter Modal */}
      <Modal className="customed-dark-card" backdrop="blur" isOpen={isFilterOpen} onClose={onFilterClose} size="2xl">
        <ModalContent>
          <ModalHeader>Filter Audit Logs</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Action"
                placeholder="Select action"
                selectedKeys={filterAction ? [filterAction] : []}
                onSelectionChange={(keys) => setFilterAction(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: 'border border-black/20 dark:border-white/20',
                  popoverContent: 'bg-gray-50 dark:bg-gray-800 border border-black/20 dark:border-white/20',
                }}
              >
                <SelectItem key="login">Login</SelectItem>
                <SelectItem key="logout">Logout</SelectItem>
                <SelectItem key="product_created">Product Created</SelectItem>
                <SelectItem key="product_updated">Product Updated</SelectItem>
                <SelectItem key="sale_created">Sale Created</SelectItem>
                <SelectItem key="sale_refunded">Sale Refunded</SelectItem>
              </Select>
              
              <Select
                label="Resource"
                placeholder="Select resource"
                selectedKeys={filterResource ? [filterResource] : []}
                onSelectionChange={(keys) => setFilterResource(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: 'border border-black/20 dark:border-white/20',
                  popoverContent: 'bg-gray-50 dark:bg-gray-800 border border-black/20 dark:border-white/20',
                }}
              >
                <SelectItem key="user">User</SelectItem>
                <SelectItem key="product">Product</SelectItem>
                <SelectItem key="sale">Sale</SelectItem>
                <SelectItem key="security">Security</SelectItem>
              </Select>
              
              <Select
                label="Severity"
                placeholder="Select severity"
                selectedKeys={filterSeverity ? [filterSeverity] : []}
                onSelectionChange={(keys) => setFilterSeverity(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: 'border border-black/20 dark:border-white/20',
                  popoverContent: 'bg-gray-50 dark:bg-gray-800 border border-black/20 dark:border-white/20',
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
                <SelectItem key="critical">Critical</SelectItem>
              </Select>
              
              <Select
                label="Status"
                placeholder="Select status"
                selectedKeys={filterStatus ? [filterStatus] : []}
                onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: 'border border-black/20 dark:border-white/20',
                  popoverContent: 'bg-gray-50 dark:bg-gray-800 border border-black/20 dark:border-white/20',
                }}
              >
                <SelectItem key="success">Success</SelectItem>
                <SelectItem key="warning">Warning</SelectItem>
                <SelectItem key="error">Error</SelectItem>
                <SelectItem key="info">Info</SelectItem>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                classNames={{
                  inputWrapper: 'border border-black/20 dark:border-white/20',
                }}
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                classNames={{
                  inputWrapper: 'border border-black/20 dark:border-white/20',
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onClick={onFilterClose}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleFilter} isLoading={filterLoading}>
              Apply Filter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Detail Modal */}
      <Modal className="customed-dark-card" backdrop="blur" isOpen={isDetailOpen} onClose={onDetailClose} size="3xl">
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalBody>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp</p>
                    <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User</p>
                    <p className="text-sm">
                      {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'Unknown User'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Action</p>
                    <p className="text-sm">{formatAction(selectedLog.action)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource</p>
                    <p className="text-sm">{selectedLog.resource}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource ID</p>
                    <p className="text-sm">{selectedLog.resourceId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Severity</p>
                    <Chip
                      size="sm"
                      color={getSeverityColor(selectedLog.severity) as any}
                      variant="flat"
                    >
                      {selectedLog.severity}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                    <Chip
                      size="sm"
                      color={getStatusColor(selectedLog.status) as any}
                      variant="flat"
                    >
                      {selectedLog.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</p>
                    <p className="text-sm">{selectedLog.source}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IP Address</p>
                    <p className="text-sm">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Session ID</p>
                    <p className="text-sm">{selectedLog.sessionId || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">User Agent</p>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedLog.userAgent}
                  </p>
                </div>
                
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Details</p>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Metadata</p>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={onDetailClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 