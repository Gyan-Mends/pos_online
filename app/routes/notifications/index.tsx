import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Badge, 
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab
} from "@heroui/react";
import { 
  Bell, 
  BellOff,
  AlertTriangle, 
  Package, 
  Clock, 
  CheckCircle2,
  Trash2,
  CheckCheck,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { successToast, errorToast } from '../../components/toast';
import type { Notification } from '../../utils/notificationService';
import { manualLowStockCheck } from '../../utils/debugNotifications';

const NotificationIcon = ({ type, severity }: { type: string; severity: string }) => {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'expiry':
      return <Clock className={iconClass} />;
    case 'low_stock':
      return <Package className={iconClass} />;
    case 'system':
      return <Bell className={iconClass} />;
    case 'order':
      return <CheckCircle2 className={iconClass} />;
    default:
      return <AlertTriangle className={iconClass} />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'primary';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'expiry': return 'Product Expiry';
    case 'low_stock': return 'Low Stock';
    case 'system': return 'System';
    case 'order': return 'Order';
    default: return 'Notification';
  }
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    refresh 
  } = useNotifications();
  
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isClearOpen, onOpen: onClearOpen, onClose: onClearClose } = useDisclosure();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter notifications based on selected tab
  const filteredNotifications = notifications.filter(notification => {
    switch (selectedTab) {
      case 'unread':
        return !notification.isRead;
      case 'expiry':
        return notification.type === 'expiry';
      case 'low_stock':
        return notification.type === 'low_stock';
      case 'system':
        return notification.type === 'system';
      default:
        return true;
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    onDetailOpen();
  };

  const handleActionClick = (notification: Notification) => {
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    successToast('All notifications marked as read');
  };

  const handleClearAll = () => {
    clearAll();
    onClearClose();
    successToast('All notifications cleared');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    // Simulate refresh delay for better UX
    setTimeout(() => {
      setIsRefreshing(false);
      successToast('Notifications refreshed');
    }, 1000);
  };

  const handleDebugLowStock = async () => {
    try {
      setIsRefreshing(true);
      const result = await manualLowStockCheck();
      refresh(); // Refresh notifications after manual check
      successToast(`Debug complete! Found ${result.lowStockProducts.length} low stock products. Check console for details.`);
    } catch (error) {
      errorToast('Debug failed. Check console for details.');
      console.error('Debug error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7" />
            Notifications
            {unreadCount > 0 && (
              <Badge color="danger" content={unreadCount} size="lg" />
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with important alerts and system messages
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            size="sm"
            color="secondary"
            startContent={<Package className="w-4 h-4" />}
            onClick={handleDebugLowStock}
            isLoading={isRefreshing}
          >
            Check Low Stock
          </Button>
          
          <Button
            variant="flat"
            size="sm"
            startContent={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="flat"
              size="sm"
              color="primary"
              startContent={<CheckCheck className="w-4 h-4" />}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
          
          {notifications.length > 0 && (
            <Button
              variant="flat"
              size="sm"
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
              onClick={onClearOpen}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-danger" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                <p className="text-xl font-bold">
                  {notifications.filter(n => n.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-xl font-bold">
                  {notifications.filter(n => n.isRead).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key as string)}
            variant="bordered"
          >
            <Tab key="all" title="All Notifications" />
            <Tab key="unread" title={`Unread (${unreadCount})`} />
            <Tab key="expiry" title="Product Expiry" />
            <Tab key="low_stock" title="Low Stock" />
            <Tab key="system" title="System" />
          </Tabs>
        
      
      {/* Notifications List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {selectedTab === 'all' ? 'All Notifications' : 
             selectedTab === 'unread' ? 'Unread Notifications' :
             getTypeLabel(selectedTab) + ' Notifications'}
          </h3>
        </CardHeader>
        <CardBody>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "No notifications match the current filter."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    notification.isRead 
                      ? 'customed-dark-card' 
                      : 'customed-dark-card'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      getSeverityColor(notification.severity) === 'danger' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                      getSeverityColor(notification.severity) === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                      getSeverityColor(notification.severity) === 'primary' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    }`}>
                      <NotificationIcon type={notification.type} severity={notification.severity} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                            </p>
                            <Chip 
                              size="sm" 
                              color={getSeverityColor(notification.severity) as any}
                              variant="flat"
                            >
                              {notification.severity}
                            </Chip>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getTypeLabel(notification.type)}</span>
                            <span>{formatRelativeTime(notification.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          
                          
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                              successToast('Notification removed');
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Notification Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {selectedNotification && (
              <>
                <NotificationIcon 
                  type={selectedNotification.type} 
                  severity={selectedNotification.severity} 
                />
                <span>{selectedNotification.title}</span>
                <Chip 
                  size="sm" 
                  color={getSeverityColor(selectedNotification.severity) as any}
                  variant="flat"
                >
                  {selectedNotification.severity}
                </Chip>
              </>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedNotification && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Message</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedNotification.message}
                  </p>
                </div>
                
                <Divider />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Type</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {getTypeLabel(selectedNotification.type)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Severity</p>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {selectedNotification.severity}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Status</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedNotification.isRead ? 'Read' : 'Unread'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Created</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {format(selectedNotification.createdAt, 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onDetailClose}>
              Close
            </Button>
            {selectedNotification?.data?.actionUrl && (
              <Button
                color="primary"
                startContent={<ExternalLink className="w-4 h-4" />}
                onClick={() => {
                  if (selectedNotification) {
                    handleActionClick(selectedNotification);
                    onDetailClose();
                  }
                }}
              >
                {selectedNotification.data.action || 'View'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal isOpen={isClearOpen} onClose={onClearClose}>
        <ModalContent>
          <ModalHeader>Clear All Notifications</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to clear all notifications? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onClearClose}>
              Cancel
            </Button>
            <Button color="danger" onClick={handleClearAll}>
              Clear All
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}