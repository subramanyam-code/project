'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { notificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list(),
  });

  const notifications = notifData?.items ?? [];

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeColor = (notif: Notification) => {
    const t = notif.notification_type ?? notif.type ?? '';
    if (t === 'success') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    if (t === 'warning') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    if (t === 'error') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
  };

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              onClick={() => markAllAsReadMutation.mutate()}
              loading={markAllAsReadMutation.isPending}
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </Card>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'bg-white dark:bg-gray-800'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification)}`}>
                        {notification.notification_type ?? notification.type ?? 'info'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        loading={markAsReadMutation.isPending}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteMutation.mutate(notification.id)}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">You're all caught up! Check back later for updates.</p>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
