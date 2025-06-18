import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { Switch } from './ui/switch'

export default function SettingsApiKeysTab({ user, apiKey, setApiKey, onSaveApiKey, useOwnKey, setUseOwnKey, loading }) {
  const [inputValue, setInputValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState('saved')

  useEffect(() => {
    setInputValue(apiKey || '')
  }, [apiKey])

  const isValidOpenRouterKey = key => key && key.length === 73 && key.startsWith('sk-')

  const handleSave = async () => {
    if (!isValidOpenRouterKey(inputValue)) {
      toast.error('Invalid OpenRouter API key')
      return
    }
    setStatus('saving')
    try {
      await onSaveApiKey(inputValue)
      setStatus('saved')
      toast.success('API key encrypted and saved!')
    } catch (e) {
      console.error(e)
      setStatus('error')
      toast.error('Failed to save API key')
    }
  }

  return (
    <div className='p-6 flex flex-col gap-6'>
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSave()
        }}
        className='flex flex-col gap-2'
        autoComplete='off'
      >
        <label className='text-xs text-[#90808A] dark:text-[#bdbdbd] block text-left'>OpenRouter API Key</label>
        <div className='flex items-center gap-2'>
          <input
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className='px-3 py-2 rounded-md border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#0e0e10] dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-sm w-full max-w-md'
            placeholder='Enter your OpenRouter API key...'
            autoComplete='off'
            spellCheck={false}
          />
          <button
            type='button'
            onClick={() => setShowKey(v => !v)}
            className='p-2 rounded-md border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#bdbdbd] hover:text-[#DC749E] transition'
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            type='submit'
            className='p-2 rounded-md border border-[#ececec] dark:border-[#232228] bg-[#f5f5fa] dark:bg-[#232228] text-[#bdbdbd] hover:text-[#DC749E] transition flex items-center gap-1'
            disabled={loading || status === 'saving'}
          >
            {status === 'saving' ? <Loader size={16} className='animate-spin' /> : <Check size={16} className='text-green-500' />}
            Save
          </button>
        </div>
      </form>
      <div className='flex items-center gap-3 mt-4'>
        <Switch
          checked={useOwnKey}
          onCheckedChange={setUseOwnKey}
          id='use-own-key-switch'
          disabled={!isValidOpenRouterKey(inputValue)}
        />
        <label htmlFor='use-own-key-switch' className='text-sm text-[#90808A] dark:text-[#bdbdbd] cursor-pointer flex items-center gap-2'>
          Use my own OpenRouter API key for requests
        </label>
      </div>
      <div className='text-xs text-[#90808A] dark:text-[#bdbdbd] mt-2 max-w-lg'>
        Your API key is encrypted and stored securely. You can choose to use your own key for OpenRouter requests. If disabled, the default system key will be used (if available).
      </div>
    </div>
  )
} 