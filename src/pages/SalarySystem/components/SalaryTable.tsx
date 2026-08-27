import React, { useMemo, useState, useRef } from 'react';
import type { SalaryResult } from '../utils/salaryCalculations';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Clock } from 'lucide-react';

interface SalaryTableProps {
  data: SalaryResult[];
  onOpenDutyLogModal: (user: any) => void;
  onPrintPayslip: (user: SalaryResult) => void;
}

export default function SalaryTable({ data, onOpenDutyLogModal, onPrintPayslip }: SalaryTableProps) {
  const filteredData = useMemo(
    () => data.filter(item => item.total_hours > 0 || item.total_minutes > 0),
    [data]
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnHelper = createColumnHelper<SalaryResult>();

  const columns = useMemo(() => [
    columnHelper.accessor('ic_name', {
      header: 'ชื่อ-สกุล (IC)',
      cell: info => {
        const item = info.row.original;
        return (
          <div>
            <div className="font-semibold text-slate-700">{item.ic_name}</div>
            <div className="text-sm text-slate-500">{item.position_name}</div>
          </div>
        );
      },
      sortingFn: 'alphanumeric',
      size: 200,
    }),
    columnHelper.accessor('total_minutes', {
      header: 'เวลาเข้าเวร (ชม.)',
      cell: info => {
        const item = info.row.original;
        return (
          <div className="text-center">
            <div className="font-semibold text-slate-700">{item.total_hours} ชม.</div>
            <div className="text-xs text-slate-400">
              ({Math.floor(item.total_minutes / 60)}h {Math.floor(item.total_minutes % 60)}m)
            </div>
          </div>
        );
      },
      size: 150,
    }),
    columnHelper.accessor(
      row => row.ic_salary + row.story_money + (row.mentor_money || 0),
      {
        id: 'netTotal',
        header: 'เงิน IC สุทธิ (รวมโบนัส)',
        cell: info => {
          const item = info.row.original;
          const netTotal = info.getValue();
          return (
            <div className="text-right">
              <div className="font-bold text-green-600 text-[1.1rem]">
                {netTotal > 0 ? netTotal.toLocaleString() : '-'}
              </div>
              {(item.story_money > 0 || item.mentor_money > 0) && (
                <div className="text-xs text-emerald-500 font-medium mt-0.5">
                  (+โบนัส 
                  {item.story_money > 0 && item.mentor_money > 0 ? 'สตอรี่/พี่เลี้ยง' : 
                   item.story_money > 0 ? 'สตอรี่' : 
                   item.mentor_money > 0 ? 'พี่เลี้ยง' : ''})
                </div>
              )}
            </div>
          );
        },
        size: 180,
      }
    ),
    columnHelper.accessor('oc_money', {
      header: 'เงิน OC',
      cell: info => {
        const val = info.getValue();
        return (
          <div className="text-right font-bold" style={{ color: val > 0 ? '#ea580c' : 'inherit' }}>
            {val > 0 ? val.toLocaleString() : '-'}
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor(
      row => row.gacha_ic + row.agency_gacha + row.gacha_premium + row.gacha_promote,
      {
        id: 'totalGacha',
        header: 'รวมกาชา',
        cell: info => {
          const val = info.getValue();
          return (
            <div className="text-center font-bold" style={{ color: val > 0 ? '#8b5cf6' : 'inherit' }}>
              {val > 0 ? val : '-'}
            </div>
          );
        },
        size: 100,
      }
    ),
    columnHelper.accessor('coins', {
      header: 'เหรียญกิจกรรม',
      cell: info => {
        const val = info.getValue();
        return (
          <div className="text-center font-bold" style={{ color: val > 0 ? '#f59e0b' : 'inherit' }}>
            {val > 0 ? val : '-'}
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'จัดการ',
      cell: info => {
        const item = info.row.original;
        return (
          <div className="flex gap-2 justify-center hide-on-print">
            <button 
              onClick={() => onPrintPayslip(item)} 
              className="w-9 h-9 rounded-xl border border-green-200 bg-green-50 text-green-600 flex items-center justify-center cursor-pointer hover:bg-green-100 hover:-translate-y-0.5 transition-all" 
              title="พิมพ์สลิปเงินเดือน"
            >
              <FileText size={18} />
            </button>
            <button 
              onClick={() => onOpenDutyLogModal(item)} 
              className="w-9 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 hover:-translate-y-0.5 transition-all" 
              title="ดูประวัติเข้าเวร"
            >
              <Clock size={18} />
            </button>
          </div>
        );
      },
      size: 120,
    }),
  ], [onPrintPayslip, onOpenDutyLogModal]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 76,
    overscan: 10,
  });

  if (filteredData.length === 0) {
    return (
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        ไม่มีคนเข้าเวรในรอบบิลนี้
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)] overflow-hidden flex flex-col">
      <div 
        ref={tableContainerRef} 
        className="overflow-auto max-h-[600px] w-full"
      >
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-white z-10 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  
                  return (
                    <th 
                      key={header.id} 
                      className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap bg-white"
                      style={{
                        width: header.column.getSize(),
                        cursor: canSort ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2" style={{
                        justifyContent: header.id === 'netTotal' || header.id === 'oc_money' ? 'flex-end' 
                          : header.id === 'actions' ? 'center' 
                          : header.id === 'total_minutes' || header.id === 'totalGacha' || header.id === 'coins' ? 'center' 
                          : 'flex-start'
                      }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <div className="flex flex-col text-slate-300">
                            {isSorted === 'asc' ? <ArrowUp size={14} className="text-blue-500" />
                             : isSorted === 'desc' ? <ArrowDown size={14} className="text-blue-500" />
                             : <ArrowUpDown size={14} />}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr><td style={{ height: `${paddingTop}px` }} colSpan={columns.length} /></tr>
            )}
            {virtualItems.map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <tr 
                  key={row.id} 
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  style={{ height: `${virtualRow.size}px` }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className="p-4 align-middle"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr><td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} /></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
