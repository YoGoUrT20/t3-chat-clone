import { useState } from 'react'
import { CreditCard, ExternalLink, Loader, BadgeCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useIsMobile } from '../hooks/use-mobile'


export default function SettingsSubscriptionTab({ user }) {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)

  const isPremium = user?.status === 'premium'

  const handleSubscribe = async () => {
    setLoading(true)
    try {
        const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
        const res = await fetch(`${FUNCTIONS_URL}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      })
      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      toast.error('Failed to start subscription')
    }
    setLoading(false)
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
      const res = await fetch(`${FUNCTIONS_URL}/createCustomerPortalSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      })
      if (!res.ok) throw new Error('Failed to open portal')
      const { url } = await res.json()
      window.open(url, '_blank')
      toast.success('Opened subscription management portal')
    } catch {
      toast.error('Failed to open portal')
    }
    setLoading(false)
  }

  return (
    <div className={`w-full flex flex-col gap-6 ${isMobile ? 'p-2' : 'p-6'}`}>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2 text-lg font-semibold text-[#0e0e10] dark:text-white'>
          <CreditCard size={20} />
          Subscription Plan
          {isPremium ? (
            <span className='flex items-center gap-1 bg-[#F9B4D0]/30 text-[#DC749E] px-2 py-0.5 rounded text-xs font-bold ml-2'>
              <BadgeCheck size={14} /> Premium
            </span>
          ) : (
            <span className='flex items-center gap-1 bg-gray-200 dark:bg-[#232228] text-gray-600 dark:text-[#ececec] px-2 py-0.5 rounded text-xs font-bold ml-2'>
              Free
            </span>
          )}
        </div>
        <div className='text-base text-[#232228] dark:text-[#ececec]'>
          {isPremium ? (
            <span>You are subscribed to <span className='font-semibold text-[#DC749E]'>Premium</span>. Enjoy all features and priority support.</span>
          ) : (
            <span>
              Upgrade to <span className='font-semibold text-[#DC749E]'>Premium</span> for $9/month.<br />
              <span className='text-sm text-[#DC749E]'>Unlock unlimited chats, priority support, and more.</span>
            </span>
          )}
        </div>
      </div>
      <button
        type='button'
        onClick={isPremium ? handleManage : handleSubscribe}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded border border-[#ececec] dark:border-[#232228] font-semibold transition-all ${
          isPremium
            ? 'bg-[#F9B4D0]/10 text-[#DC749E] hover:bg-[#F9B4D0]/20'
            : 'bg-[#DC749E] text-white hover:bg-[#DC749E]/90'
        } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? <Loader size={18} className='animate-spin' /> : <ExternalLink size={18} />}
        {isPremium ? 'Manage Subscription' : 'Subscribe to Premium'}
      </button>
    </div>
  )
} 