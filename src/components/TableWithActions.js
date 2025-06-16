import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Copy, Download } from 'lucide-react';

function TableWithActions({ children }) {
  const [showButtons] = useState(true);
  const tableRef = useRef(null);
  function getTableData() {
    const rows = Array.from(tableRef.current?.querySelectorAll('tr') || []);
    return rows.map(row =>
      Array.from(row.querySelectorAll('th,td')).map(cell => cell.innerText)
    );
  }
  function toCSV(data) {
    return data.map(row => row.map(cell => '"' + cell.replace(/"/g, '""') + '"').join(',')).join('\n');
  }
  function handleCopyTable() {
    const data = getTableData();
    const tsv = data.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv);
    toast.success('Table copied!');
  }
  function handleDownloadTable() {
    const data = getTableData();
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    toast.success('CSV downloaded!');
  }
  return (
    <div className='w-full my-4 flex flex-col items-center'>
      <table ref={tableRef} className='w-full border-collapse rounded-t-lg overflow-hidden bg-[#221D27]'>{children}</table>
      {showButtons && (
        <div className='w-full mb-1 px-2 py-1 rounded-b-lg rounded-t-none bg-[#18141C] border-x border-b border-[#332940] shadow-sm flex items-center justify-end' style={{marginTop: '0', borderTop: 'none'}}>
          <button
            className='flex items-center justify-center p-2 rounded hover:bg-[#332940] transition shadow'
            type='button'
            onClick={handleCopyTable}
            aria-label='Copy table'
          >
            <Copy size={18} className='text-[#BFB3CB]' />
          </button>
          <button
            className='flex items-center justify-center p-2 rounded hover:bg-[#332940] transition shadow ml-2'
            type='button'
            onClick={handleDownloadTable}
            aria-label='Download CSV'
          >
            <Download size={18} className='text-[#BFB3CB]' />
          </button>
        </div>
      )}
    </div>
  );
}

export default TableWithActions; 