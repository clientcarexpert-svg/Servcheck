import { toast } from 'sonner';

export const requestCameraAccess = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera not supported on this device.');
      return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    toast.success('Camera access granted.');
    return true;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      toast.error('Camera permission denied. Enable in Settings to use this feature.');
    } else {
      toast.error('Camera access failed.');
    }
    return false;
  }
};

export const recordCameraPermission = async (base44, granted) => {
  try {
    const existing = await base44.asServiceRole.entities.UserAcceptances.filter(
      { user_email: (await base44.auth.me()).email },
      '-created_date',
      1
    );
    if (existing.length > 0) {
      await base44.asServiceRole.entities.UserAcceptances.update(existing[0].id, {
        camera_permission: granted ? 'granted' : 'denied'
      });
    }
  } catch (err) {
    console.error('Failed to record camera permission:', err);
  }
};