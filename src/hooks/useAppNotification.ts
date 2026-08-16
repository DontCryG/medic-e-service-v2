import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export function useAppNotification() {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string, title = 'เกิดข้อผิดพลาด') => {
    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: 'var(--primary)'
    });
  };

  const showWarning = (message: string, title = 'แจ้งเตือน') => {
    Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: 'var(--primary)'
    });
  };

  const confirmAction = async ({ 
    title, 
    text, 
    confirmText = 'ยืนยัน', 
    cancelText = 'ยกเลิก', 
    confirmColor = 'var(--danger)' 
  }: { 
    title: string; 
    text: string; 
    confirmText?: string; 
    cancelText?: string; 
    confirmColor?: string; 
  }) => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: 'var(--text-secondary)',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });
    return result.isConfirmed;
  };

  return { showSuccess, showError, showWarning, confirmAction };
}
