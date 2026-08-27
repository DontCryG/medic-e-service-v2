import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError() {
  const error = useRouteError();
  console.error('Global Error Caught:', error);

  const handleRefresh = () => {
    window.location.reload();
  };

  let errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิดในการโหลดข้อมูล';
  let isChunkLoadError = false;

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch dynamically imported module')) {
      errorMessage = 'มีการอัปเดตเวอร์ชันใหม่ หรือสัญญาณอินเทอร์เน็ตขาดหาย กรุณารีเฟรชหน้าจอ';
      isChunkLoadError = true;
    } else {
      errorMessage = error.message;
    }
  } else if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] text-center border border-slate-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={36} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          {isChunkLoadError ? 'ข้อมูลเวอร์ชันใหม่พร้อมใช้งาน' : 'โอ๊ะโอ! เกิดข้อผิดพลาด'}
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          {errorMessage}
        </p>

        <button 
          onClick={handleRefresh}
          className="w-full py-3.5 px-6 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <RefreshCw size={18} />
          รีเฟรชหน้าจอ
        </button>

        {isChunkLoadError && (
          <p className="mt-4 text-xs text-slate-400">
            ระบบกำลังพยายามโหลดหน้าจออีกครั้งโดยอัตโนมัติ...
          </p>
        )}
      </div>
    </div>
  );
}
