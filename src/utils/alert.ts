import Swal, { type SweetAlertOptions } from 'sweetalert2';

/**
 * Enterprise Themed SweetAlert2 Mixin
 * Ensures consistent modern branding across all dialogs in the application.
 */
export const enterpriseSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl p-6 shadow-2xl border border-slate-100 font-sans',
    title: 'text-xl font-bold text-slate-800 pt-2',
    htmlContainer: 'text-sm text-slate-500 leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm border-none cursor-pointer mx-1.5',
    cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all border-none cursor-pointer mx-1.5',
    denyButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all border-none cursor-pointer mx-1.5'
  },
  buttonsStyling: false
});

export const showConfirmDialog = async (options: SweetAlertOptions) => {
  return enterpriseSwal.fire({
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    ...options
  });
};

export const showSuccessAlert = (title: string, text?: string) => {
  return enterpriseSwal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    showConfirmButton: false
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return enterpriseSwal.fire({
    icon: 'error',
    title,
    text
  });
};
