import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useCreateRequest } from '../hooks/useRequestMutations';
import { useAuthStore } from '@/store/authStore';

interface CreateRequestModalProps {
  onClose: () => void;
}

export default function CreateRequestModal({ onClose }: CreateRequestModalProps) {
  const { user } = useAuthStore();
  const createMutation = useCreateRequest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user?.discord_id) return;

    createMutation.mutate(
      { discord_id: user.discord_id, title, description },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ยื่นคำร้องใหม่</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="modal-form-group">
            <label>หัวข้อคำร้อง <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="เช่น ขอเลื่อนขั้น, ขอเบิกวิทยุสื่อสาร, ร้องเรียน..."
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div className="modal-form-group">
            <label>รายละเอียด <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดคำร้องของคุณ..."
              required
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="modal-btn cancel" onClick={onClose} disabled={createMutation.isPending}>
              ยกเลิก
            </button>
            <button type="submit" className="modal-btn save" disabled={createMutation.isPending || !title.trim() || !description.trim()}>
              <Send size={18} />
              {createMutation.isPending ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
