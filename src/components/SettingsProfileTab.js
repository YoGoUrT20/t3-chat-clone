import { Info, HardDrive } from 'lucide-react'
import Tooltip from './Tooltip'
import Dropdown from './Dropdown'
import { Switch } from './ui/switch'
import Iso6391 from 'iso-639-1'
import { models } from '../models'

export default function SettingsProfileTab({
  systemPrompt,
  setSystemPrompt,
  status,
  statusIcon,
  showTooltip,
  setShowTooltip,
  tooltipX,
  setTooltipX,
  tooltipY,
  setTooltipY,
  preferredLanguage,
  setPreferredLanguage,
  user,
  userStats,
  reasoningEnabled,
  setReasoningEnabled,
  onLanguageChange,
  onReasoningChange,
  defaultModel,
  setDefaultModel,
  onDefaultModelChange
}) {
  return (
    <div className='w-full p-6 pointer-events-none bg-transparent shadow-none'>
      <div className='w-full relative'>
        <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] mb-1 block text-left pointer-events-auto' style={{display:'flex',alignItems:'center',gap:'6px'}}>
          System Prompt
          <span
            style={{display:'inline-flex',alignItems:'center',cursor:'pointer',position:'relative'}}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipX(rect.left + rect.width / 2);
              setTooltipY(rect.bottom + window.scrollY);
              setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={15} className='ml-1 text-[#bdbdbd]' />
            {showTooltip && (
              <Tooltip x={tooltipX} y={tooltipY} text={'A system prompt is an instruction or context given to the AI before your messages. It helps guide the assistant\'s behavior.'} />
            )}
          </span>
        </label>
        <textarea
          value={systemPrompt}
          onChange={e => {
            setSystemPrompt(e.target.value)
          }}
          className='w-full px-3 py-2 rounded-md border-2 border-[#d1b3c4] dark:border-[#a97ca5] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-sm pointer-events-auto resize-none'
          placeholder='Enter your system prompt...'
          rows={5}
        />
        <div className='absolute bottom-2 right-3 pointer-events-auto'>
          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#f5f5fa] dark:bg-[#232228] border border-[#ececec] dark:border-[#232228] ${status === 'saved' ? 'text-[#0e0e10] dark:text-white' : ''}`}>
            {statusIcon}
            {status === 'saved' && 'saved'}
            {status === 'saving' && 'saving'}
            {status === 'error' && 'error'}
          </span>
        </div>
      </div>
      <div className='w-full mt-4 pointer-events-auto flex flex-col gap-1'>
        <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] block text-left'>Preferred Language</label>
        <div className='w-full flex items-center'>
          <Dropdown
            items={Iso6391.getAllCodes().map(code => ({ code, name: Iso6391.getName(code) })).filter(l => l.name)}
            value={preferredLanguage}
            onChange={onLanguageChange}
          />
        </div>
        <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] block text-left mt-4'>Default Model</label>
        <div className='w-full flex items-center'>
          <Dropdown
            items={(user && user.status !== 'premium'
              ? models.filter(m => m.freeAccess === true || m.apiKeyRequired === true)
              : models
            ).map(m => ({ code: m.name, name: m.displayName, apiKeyRequired: m.apiKeyRequired }))}
            value={defaultModel}
            onChange={onDefaultModelChange}
            placeholder='Select model'
            leftIcon={<HardDrive size={18} className='text-[#bdbdbd]' />}
          />
        </div>
        <div className='flex items-center gap-3 mt-4'>
          <Switch
            checked={reasoningEnabled}
            onCheckedChange={onReasoningChange}
            id='reasoning-switch'
          />
          <label htmlFor='reasoning-switch' className='text-sm text-[#90808A] dark:text-[#bdbdbd] cursor-pointer'>Show model reasoning/thinking</label>
        </div>
        <div className='w-full mt-4 flex flex-col gap-2 rounded-lg border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] p-4'>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#90808A] dark:text-[#bdbdbd] min-w-[120px]'>Total tokens used</span>
            <span className='font-semibold text-[#0e0e10] dark:text-white'>{userStats.totalTokens.toLocaleString()}</span>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#90808A] dark:text-[#bdbdbd] min-w-[120px]'>Total messages</span>
            <span className='font-semibold text-[#0e0e10] dark:text-white'>{userStats.totalMessages.toLocaleString()}</span>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#90808A] dark:text-[#bdbdbd] min-w-[120px]'>Images generated</span>
            <span className='font-semibold text-[#0e0e10] dark:text-white'>{userStats.totalImages.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 