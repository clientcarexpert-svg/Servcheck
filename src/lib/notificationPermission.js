import { toast } from "sonner";

export const requestNotificationPermission = async () => {
  // Check HTTPS
  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
    toast.error('Notifications require secure connection (HTTPS). Please use the published app.');
    return false;
  }

  if (!('Notification' in window)) {
    toast.error('Notifications not supported on this device.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    toast.error('Notification access is required. Please enable notifications in your phone settings to continue.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled.');
      return true;
    } else {
      toast.error('Notification access is required. Please enable notifications in your phone settings to continue.');
      return false;
    }
  } catch (err) {
    toast.error('Failed to request notification permission.');
    return false;
  }
};