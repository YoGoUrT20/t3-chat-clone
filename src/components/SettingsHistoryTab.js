import React, { useState } from 'react'
import toast from 'react-hot-toast'
import Dropdown from './Dropdown'
import { User, Bot, Trash } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { colorThemes, backgroundOptions, glowOptions, modelFamilyGlowGradients } from '../constants'
import { models } from '../models'
import TableWithActions from './TableWithActions'
import { useIsMobile } from '../hooks/use-mobile'
import styles from './Chat.module.css'
import DeleteAccountDialog from './DeleteAccountDialog'
import { deleteConversation, deleteConversationsBulk } from '../hooks/use-conversations'

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
  if (filters.startDate) filtered = filtered.filter(c => {
    let last = c.lastUsed
    if (last && typeof last.toDate === 'function') last = last.toDate()
    else if (typeof last === 'string') last = new Date(last)
    else if (!(last instanceof Date)) last = new Date()
    return last >= new Date(filters.startDate)
  })
  if (filters.endDate) filtered = filtered.filter(c => {
    let last = c.lastUsed
    if (last && typeof last.toDate === 'function') last = last.toDate()
    else if (typeof last === 'string') last = new Date(last)
    else if (!(last instanceof Date)) last = new Date()
    return last <= new Date(filters.endDate)
  })
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
  const isMobile = useIsMobile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    setDeleting(true)
    try {
      if (!filterConversationId) {
        // Delete all
        await deleteConversationsBulk(conversations.map(c => c.id))
        setFilterConversationId('')
        toast.success('All conversations deleted!')
      } else {
        await deleteConversation(filterConversationId)
        setFilterConversationId('')
        toast.success('Conversation deleted!')
      }
    } catch (e) {
      toast.error('Failed to delete conversation(s)')
    }
    setDeleting(false)
    setShowDeleteDialog(false)
  }

  return (
    <div className='p-6 flex flex-col gap-6'>
      <div className='bg-[#f5f5fa] dark:bg-[#232228] border border-[#ececec] dark:border-[#232228] rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-end md:gap-x-4 gap-y-4 items-stretch max-w-[900px] mx-auto'>
        <div className='flex flex-col min-w-0 flex-1'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-2 font-medium'>Format</label>
          <div className='relative'>
            <Dropdown
              items={[{ code: 'json', name: 'JSON' }, { code: 'csv', name: 'CSV' }]}
              value={exportFormat}
              onChange={setExportFormat}
              placeholder='Select format'
              hideChevron={true}
              leftIcon={null}
            />
          </div>
        </div>
        <div className='flex flex-col min-w-0 flex-1'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-2 font-medium'>Conversation</label>
          <div className='relative'>
            <Dropdown
              items={[{ code: '', name: 'All' }, ...conversations.map(c => ({ code: c.id, name: c.name || (c.messages && c.messages[0] && c.messages[0].content ? c.messages[0].content.slice(0, 32) + (c.messages[0].content.length > 32 ? '…' : '') : c.id) }))]}
              value={filterConversationId}
              onChange={setFilterConversationId}
              placeholder='Select conversation'
              hideChevron={true}
              leftIcon={null}
            />
          </div>
        </div>
        <div className='flex flex-col min-w-0 flex-1'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-2 font-medium'>Start Date</label>
          <input
            type='date'
            value={filterStartDate || ''}
            onChange={e => setFilterStartDate(e.target.value)}
            className='w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#ececec] dark:border-[#232228] bg-white dark:bg-[#18171c] text-[#0e0e10] dark:text-white text-sm focus:ring-2 focus:ring-[#d1b3c4] transition min-h-[40px]'
            style={{ minHeight: 40 }}
          />
        </div>
        <div className='flex flex-col min-w-0 flex-1'>
          <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-2 font-medium'>End Date</label>
          <input
            type='date'
            value={filterEndDate || ''}
            onChange={e => setFilterEndDate(e.target.value)}
            className='w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#ececec] dark:border-[#232228] bg-white dark:bg-[#18171c] text-[#0e0e10] dark:text-white text-sm focus:ring-2 focus:ring-[#d1b3c4] transition min-h-[40px]'
            style={{ minHeight: 40 }}
          />
        </div>
        <button onClick={handleExport} className='w-full mt-2 md:mt-0 md:w-auto md:self-end px-5 py-2.5 rounded-lg bg-[#d1b3c4] dark:bg-[#a97ca5] text-[#0e0e10] dark:text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#bfa0b2] dark:hover:bg-[#8d6b8a] transition'>
          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4'/></svg>
          <span>Export</span>
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className='w-full mt-2 md:mt-0 md:w-auto md:self-end px-5 py-2.5 rounded-lg bg-[#ff6b81] dark:bg-[#a8324a] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#e05a6f] dark:hover:bg-[#8d2236] transition'
          disabled={deleting || loadingConvos || (!conversations.length)}
          type='button'
        >
          <Trash size={18} />
          <span>Delete{!filterConversationId ? ' All' : ''}</span>
        </button>
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          loading={deleting}
          title={!filterConversationId ? 'Delete All Conversations' : 'Delete Conversation'}
          description={!filterConversationId ? 'This action is irreversible. All your conversations and messages will be permanently deleted. Are you sure you want to continue?' : 'This action is irreversible. This conversation and all its messages will be permanently deleted. Are you sure you want to continue?'}
        />
      </div>
      {loadingConvos && <div className='text-sm text-[#90808A] dark:text-[#bdbdbd] mt-2'>Loading conversations...</div>}
      {!filterConversationId && conversations.length > 0 && !loadingConvos && (
        <div className='mt-6 text-sm font-bold text-center' style={{ color: '#F9B4D0' }}>Select a chat to view the conversation</div>
      )}
      {filterConversationId && (() => {
        const conv = conversations.find(c => c.id === filterConversationId)
        if (!conv) return <div className='mt-6 text-sm text-[#90808A] dark:text-[#bdbdbd]'>Conversation not found.</div>
        const fontFamily = localStorage.getItem('chat_font') || 'Roboto'
        const themeName = localStorage.getItem('chat_theme') || 'Classic'
        const themeObj = colorThemes.find(t => t.name === themeName) || colorThemes[0]
        const backgroundName = localStorage.getItem('chat_bg') || 'default'
        const bgObj = backgroundOptions.find(b => b.value === backgroundName) || backgroundOptions[0]
        const glowType = localStorage.getItem('glow_type') || 'glow-blue-purple'
        const glowIntensity = (() => {
          const val = localStorage.getItem('glow_intensity')
          return val !== null ? parseFloat(val) : 0.7
        })()
        return (
          <div className='mt-6'>
            <div className='text-base font-semibold text-[#0e0e10] dark:text-white mb-2'>{conv.name || (conv.messages && conv.messages[0] && conv.messages[0].content ? conv.messages[0].content.slice(0, 48) + (conv.messages[0].content.length > 48 ? '…' : '') : conv.id)}</div>
            <div
              className='flex flex-col gap-2 max-h-[500px] overflow-y-auto hide-scrollbar rounded-lg p-4 border border-[#ececec] dark:border-[#232228]'
              style={{ background: bgObj.style && bgObj.style.background ? bgObj.style.background : (bgObj.themeType === 'dark' ? '#232228' : '#f5f5fa') }}
            >
              {(conv.messages || []).map((msg, idx) => {
                const isUser = msg.role === 'user' || msg.sender === 'user'
                const msgBg = isUser ? themeObj.user.bg : themeObj.assistant.bg
                let msgText = isUser ? themeObj.user.text : themeObj.assistant.text
                const themeType = themeObj.themeType
                if (themeType === 'dark') msgText = '#E0E8FF'
                if (themeType === 'light') msgText = '#2A222E'
                let glowGradient = ''
                if (bgObj.value === 'model-glow' && (msg.role === 'assistant' || msg.sender === 'llm')) {
                  let modelName = (msg.model || msg.modelName || msg.model_name || '').toLowerCase()
                  let modelObj = models.find(m => (m.name && m.name.toLowerCase() === modelName) || (m.openRouterName && m.openRouterName.toLowerCase() === modelName))
                  if (!modelObj && modelName) {
                    modelObj = models.find(m => m.openRouterName && modelName.startsWith(m.openRouterName.toLowerCase()))
                  }
                  let family = modelObj ? modelObj.family : null
                  if (family && modelFamilyGlowGradients[family]) {
                    glowGradient = modelFamilyGlowGradients[family]
                  } else {
                    const found = glowOptions.find(opt => opt.value === glowType)
                    glowGradient = found ? found.gradient : glowOptions[0].gradient
                  }
                } else if (bgObj.value === 'glow-under') {
                  const found = glowOptions.find(opt => opt.value === glowType)
                  glowGradient = found ? found.gradient : glowOptions[0].gradient
                }

                // Find displayName for the model
                let modelKey = msg.model || msg.modelName || msg.model_name || msg.openRouterName || ''
                let modelObj = models.find(m => m.name === modelKey || m.openRouterName === modelKey)
                if (!modelObj && modelKey) {
                  // Try case-insensitive and partial match for openRouterName
                  modelObj = models.find(m => m.openRouterName && (m.openRouterName.toLowerCase() === modelKey.toLowerCase() || modelKey.toLowerCase().includes(m.openRouterName.toLowerCase())))
                }
                const modelDisplayName = modelObj ? modelObj.displayName : modelKey

                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}> 
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`} style={{ position: (bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) ? 'relative' : undefined }}>
                      {(bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) && (() => {
                        const randomOffset = ((Math.sin(idx * 9301 + 49297) * 233280) % 1) * 20 - 10
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              left: `calc(50% + ${randomOffset}%)`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '60%',
                              height: '60%',
                              minWidth: 60,
                              minHeight: 60,
                              padding: 60,
                              zIndex: 0,
                              pointerEvents: 'none',
                              filter: 'blur(100px)',
                              willChange: 'filter',
                              opacity: glowIntensity * 0.7,
                              background: glowGradient,
                              borderRadius: '50%',
                              transition: 'width 0.2s, height 0.2s, filter 0.2s, opacity 0.2s',
                            }}
                          />
                        )
                      })()}
                      {(msg.role === 'assistant' || msg.sender === 'llm') && (
                        <div className='flex items-end mr-2'>
                          <span className='bg-[#2A222E] p-2 rounded-full'><Bot size={20} className='text-[#BFB3CB]' /></span>
                        </div>
                      )}
                      <div className={`max-w-[70%] px-4 py-2 rounded-xl text-base ${isUser ? 'rounded-br-none self-end' : 'rounded-bl-none self-start'}`}
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          fontFamily,
                          background: msgBg,
                          color: msgText,
                          position: 'relative',
                          zIndex: 1,
                          maxWidth: isMobile ? '90vw' : '80vw',
                          boxSizing: 'border-box',
                        }}
                      >
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              if (inline) {
                                return <code className='bg-[#2A222E] px-1 py-0.5 rounded text-[#E0E8FF] font-mono text-sm'>{children}</code>
                              }
                              return (
                                <pre className={`chatMarkdownPre bg-[#2A222E] p-3 rounded-lg overflow-x-auto my-2 relative group ${styles.chatMarkdownPre}`} style={{ maxWidth: 500, overflowX: 'auto' }}>
                                  <code className={'text-[#E0E8FF] font-mono text-sm ' + (className || '')}>{children}</code>
                                </pre>
                              )
                            },
                            ul({children, ...props}) {
                              return <ul className='list-disc pl-6 my-2'>{children}</ul>
                            },
                            ol({children, ...props}) {
                              return <ol className='list-decimal pl-6 my-2'>{children}</ol>
                            },
                            li({children, ...props}) {
                              return <li className='mb-1'>{children}</li>
                            },
                            strong({children, ...props}) {
                              return <strong className='font-bold text-[#F9B4D0]'>{children}</strong>
                            },
                            table({children, ...props}) {
                              return <TableWithActions>{children}</TableWithActions>
                            },
                            thead({children, ...props}) {
                              return <thead className='bg-[#2A222E]'>{children}</thead>
                            },
                            tbody({children, ...props}) {
                              return <tbody>{children}</tbody>
                            },
                            tr({children, ...props}) {
                              return <tr className='border-b border-[#332940] last:border-0'>{children}</tr>
                            },
                            th({children, ...props}) {
                              return <th className='px-3 py-2 text-left font-semibold text-[#F9B4D0] bg-[#2A222E]'>{children}</th>
                            },
                            td({children, ...props}) {
                              return <td className='px-3 py-2 text-[#E0E8FF]'>{children}</td>
                            },
                          }}
                        >{msg.content || msg.text}</ReactMarkdown>
                        {!isUser && modelKey && (
                          <div style={{ fontSize: '0.75rem', color: msgText, marginTop: 4, opacity: 0.7 }}>
                            Model: {modelDisplayName}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className='flex items-end ml-2'>
                          <span className='bg-[#4D1F39] p-2 rounded-full'><User size={20} className='text-[#F4E9EE]' /></span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
} 