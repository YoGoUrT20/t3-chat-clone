import { Info, HardDrive, Trash } from 'lucide-react'
import Tooltip from './Tooltip'
import Dropdown from './Dropdown'
// import { Switch } from './ui/switch'
import { models } from '../models'
import { useIsMobile } from '../hooks/use-mobile'
import { Button } from './ui/button'
import DeleteAccountDialog from './DeleteAccountDialog'
import { useState } from 'react'
import toast from 'react-hot-toast'

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
  const isMobile = useIsMobile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const useOwnKey = localStorage.getItem('use_own_api_key') === 'true'

  const filteredModels = models.filter(model => {
    if (useOwnKey) {
      return true
    }
    const status = user?.status || 'free'
    if (status === 'premium') {
      return !model.apiKeyRequired
    }
    return model.freeAccess
  })

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    try {
      // TODO: Call backend delete endpoint here
      await new Promise(r => setTimeout(r, 1200))
      toast.success('Account deleted (placeholder)')
      // Optionally, sign out or redirect
    } catch (e) {
      toast.error('Failed to delete account')
    }
    setDeletingAccount(false)
    setShowDeleteDialog(false)
  }

  return (
    <div className={`w-full ${isMobile ? 'p-2' : 'p-6'} pointer-events-none bg-transparent shadow-none`}>
      <div className='w-full relative'>
        <label className='text-xs text-[#bdbdbd] mb-1 block text-left pointer-events-auto' style={{display:'flex',alignItems:'center',gap:'6px'}}>
          System Prompt
          <span
            style={{display:'inline-flex',alignItems:'center',cursor:'pointer',position:'relative'}}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipX(rect.left + rect.width / 2);
              setTooltipY(rect.bottom);
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
          className={`w-full px-3 py-2 rounded-md border-2 border-[#a97ca5] bg-[#232228] text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-sm pointer-events-auto resize-none ${isMobile ? 'text-base' : ''}`}
          placeholder='Enter your system prompt...'
          rows={5}
        />
        <div className='absolute bottom-2 right-3 pointer-events-auto'>
          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#232228] border border-[#232228] text-white`}>
            {statusIcon}
            {status === 'saved' && 'saved'}
            {status === 'saving' && 'saving'}
            {status === 'error' && 'error'}
          </span>
        </div>
      </div>
      <div className='w-full mt-4 pointer-events-auto flex flex-col gap-1'>
        <label className='text-xs text-[#bdbdbd] block text-left'>Preferred Language</label>
        <div className='w-full flex items-center'>
          <Dropdown
            items={[
              { code: 'English', name: 'English' },
              { code: 'Ukrainian', name: 'Ukrainian' },
              { code: 'Spanish', name: 'Spanish' },
              { code: 'German', name: 'German' },
              { code: 'French', name: 'French' },
              { code: 'Italian', name: 'Italian' },
              { code: 'Polish', name: 'Polish' },
              { code: 'Dutch', name: 'Dutch' },
              { code: 'Portuguese', name: 'Portuguese' },
              { code: 'Chinese', name: 'Chinese' },
              { code: 'Japanese', name: 'Japanese' },
              { code: 'Korean', name: 'Korean' },
              { code: 'Turkish', name: 'Turkish' },
              { code: 'Czech', name: 'Czech' },
              { code: 'Romanian', name: 'Romanian' },
              { code: 'Hungarian', name: 'Hungarian' },
              { code: 'Russian', name: 'Russian' },
              { code: 'Hindi', name: 'Hindi' },
              { code: 'Arabic', name: 'Arabic' },
              { code: 'Hebrew', name: 'Hebrew' },
              { code: 'Other', name: 'Other' }
            ]}
            value={preferredLanguage}
            onChange={onLanguageChange}
          />
        </div>
        <label className='text-xs text-[#bdbdbd] block text-left mt-4'>Default Model</label>
        <div className='w-full flex items-center'>
          <Dropdown
            items={filteredModels.map(m => ({ code: m.name, name: m.displayName, apiKeyRequired: m.apiKeyRequired }))}
            value={defaultModel}
            onChange={onDefaultModelChange}
            placeholder='Select model'
            leftIcon={<HardDrive size={18} className='text-[#bdbdbd]' />}
          />
        </div>
        {/*
        <div className='flex items-center gap-3 mt-4'>
          <Switch
            checked={reasoningEnabled}
            onCheckedChange={onReasoningChange}
            id='reasoning-switch'
          />
          <label htmlFor='reasoning-switch' className='text-sm text-[#bdbdbd] cursor-pointer'>Show model reasoning/thinking</label>
        </div>
        */}
        <div className={`w-full mt-4 flex flex-col gap-2 rounded-lg border border-[#232228] bg-[#232228] p-4 ${isMobile ? 'text-base' : ''}`}>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#bdbdbd] min-w-[120px]'>Total tokens used</span>
            <span className='font-semibold text-white'>{userStats.totalTokens.toLocaleString()}</span>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#bdbdbd] min-w-[120px]'>Total messages</span>
            <span className='font-semibold text-white'>{userStats.totalMessages.toLocaleString()}</span>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <span className='text-xs text-[#bdbdbd] min-w-[120px]'>Images generated</span>
            <span className='font-semibold text-white'>{userStats.totalImages.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className={`w-full mt-8 pointer-events-auto`}>
        <div className='border border-[#ff6b81] bg-[#2a1a1d] rounded-lg p-4 flex flex-col gap-3'>
          <span className='text-base font-bold text-[#ff6b81]'>Danger Zone</span>
          <span className='text-xs text-[#ff6b81]'>Deleting your account is irreversible. All your data will be permanently removed.</span>
          <Button
            variant='destructive'
            className='flex items-center gap-2 w-fit mt-2 border border-[#ff6b81] hover:bg-[#ff6b81]/10 hover:border-[#ff6b81] text-[#F2EBFA]'
            type='button'
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash size={16} /> Delete account
          </Button>
        </div>
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteAccount}
          loading={deletingAccount}
        />
      </div>
    </div>
  )
} 