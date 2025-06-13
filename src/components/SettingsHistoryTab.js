import React from 'react'
import toast from 'react-hot-toast'

function convertToCSV(data) {
  if (!data.length) return ''
  const keys = Object.keys(data[0])
  const csvRows = [keys.join(',')]
  for (const row of data) {
    csvRows.push(keys.map(k => '"' + (row[k] !== undefined ? String(row[k]).replace(/"/g, '""') : '') + '"').join(','))
  }
  return csvRows.join('\n')
}

function filterMessages(convos, filters) {
  let filtered = convos
  if (filters.conversationId) filtered = filtered.filter(c => c.id === filters.conversationId)
  if (filters.startDate) filtered = filtered.filter(c => new Date(c.lastUsed) >= new Date(filters.startDate))
  if (filters.endDate) filtered = filtered.filter(c => new Date(c.lastUsed) <= new Date(filters.endDate))
  return filtered
}

export default function SettingsHistoryTab({
  exportFormat,
  setExportFormat,
  filterConversationId,
  setFilterConversationId,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  conversations,
  loadingConvos,
}) {
  function handleExport() {
    let filtered = filterMessages(conversations, {
      conversationId: filterConversationId,
      startDate: filterStartDate,
      endDate: filterEndDate,
    })
    let exportData = []
    filtered.forEach(conv => {
      (conv.messages || []).forEach(msg => {
        exportData.push({
          conversationId: conv.id,
          date: conv.lastUsed,
          role: msg.role,
          content: msg.content,
          model: msg.model || '',
        })
      })
    })
    if (!exportData.length) {
      toast.error('No messages to export')
      return
    }
    let blob, filename
    if (exportFormat === 'csv') {
      blob = new Blob([convertToCSV(exportData)], { type: 'text/csv' })
      filename = 'messages_export.csv'
    } else {
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      filename = 'messages_export.json'
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    toast.success('Messages exported!')
  }

  return (
    <div className='p-6 flex flex-col gap-4'>
      <div className='flex flex-row gap-4 items-end'>
        <div className='flex flex-col'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-1'>Format</label>
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className='px-2 py-1 rounded border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white text-sm'>
            <option value='json'>JSON</option>
            <option value='csv'>CSV</option>
          </select>
        </div>
        <div className='flex flex-col'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-1'>Conversation</label>
          <select value={filterConversationId} onChange={e => setFilterConversationId(e.target.value)} className='px-2 py-1 rounded border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white text-sm min-w-[180px]'>
            <option value=''>All</option>
            {conversations.map(c => (
              <option key={c.id} value={c.id}>{c.name || (c.messages && c.messages[0] && c.messages[0].content ? c.messages[0].content.slice(0, 32) + (c.messages[0].content.length > 32 ? '…' : '') : c.id)}</option>
            ))}
          </select>
        </div>
        <div className='flex flex-col'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-1'>Start Date</label>
          <input type='date' value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className='px-2 py-1 rounded border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white text-sm' />
        </div>
        <div className='flex flex-col'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-1'>End Date</label>
          <input type='date' value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className='px-2 py-1 rounded border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white text-sm' />
        </div>
        <button onClick={handleExport} className='ml-4 px-4 py-2 rounded bg-[#d1b3c4] dark:bg-[#a97ca5] text-[#0e0e10] dark:text-white font-semibold text-sm flex items-center gap-2'>
          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4'/></svg>
          <span>Export</span>
        </button>
      </div>
      <div className='mt-4 text-xs text-[#90808A] dark:text-[#bdbdbd]'>
        Export your messages with filters. Only conversations stored in your browser are available for export.
      </div>
      {loadingConvos && <div className='text-sm text-[#90808A] dark:text-[#bdbdbd] mt-2'>Loading conversations...</div>}
      {filterConversationId && (() => {
        const conv = conversations.find(c => c.id === filterConversationId)
        if (!conv) return <div className='mt-6 text-sm text-[#90808A] dark:text-[#bdbdbd]'>Conversation not found.</div>
        return (
          <div className='mt-6'>
            <div className='text-base font-semibold text-[#0e0e10] dark:text-white mb-2'>{conv.name || (conv.messages && conv.messages[0] && conv.messages[0].content ? conv.messages[0].content.slice(0, 48) + (conv.messages[0].content.length > 48 ? '…' : '') : conv.id)}</div>
            <div className='flex flex-col gap-2 max-h-[350px] overflow-y-auto hide-scrollbar bg-[#f5f5fa] dark:bg-[#232228] rounded-lg p-4 border border-[#ececec] dark:border-[#232228]'>
              {(conv.messages || []).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`} style={{wordBreak:'break-word'}}>
                  <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm ${msg.role === 'user' ? 'bg-[#e7d3e1] dark:bg-[#3a2b36] text-[#0e0e10] dark:text-white' : 'bg-[#e3eaf7] dark:bg-[#232f3a] text-[#0e0e10] dark:text-white'}`}>{msg.content}</div>
                  <div className='text-[11px] text-[#90808A] dark:text-[#bdbdbd] mt-1'>{msg.role === 'user' ? 'You' : 'Assistant'}{msg.model ? ` · ${msg.model}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
} 