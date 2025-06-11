import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Copy, LogOut, Check, Loader, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import LiquidGlassButton from './LiquidGlassButton'
import { Button } from './ui/button'
import toast from 'react-hot-toast'
import SettingsTabs from './ui/SettingsTabs'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import Tooltip from './Tooltip'
import SignOutDialog from './SignOutDialog'
import MessagesLeft from './MessagesLeft'

const tabs = ['My Profile', 'Customize', 'Subscription', 'Billing', 'Security', 'Help']

const tabContents = [
  null,
  <div className='p-6'>Customize content</div>,
  <div className='p-6'>Subscription content</div>,
  <div className='p-6'>Billing content</div>,
  <div className='p-6'>Security content</div>,
  <div className='p-6'>Help content</div>,
]

export default function SettingsSubscriptionPage() {
  const { user, signOutUser, loading } = useAuth()
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [status, setStatus] = useState('saved')
  const [error, setError] = useState(null)
  const saveTimeout = useRef(null)
  const prevValue = useRef('')
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipX, setTooltipX] = useState(0)
  const [tooltipY, setTooltipY] = useState(0)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [messagesLeft, setMessagesLeft] = useState(20)
  const [resetAt, setResetAt] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!user) return
    const db = getFirestore()
    const userRef = doc(db, 'users', user.uid)
    getDoc(userRef).then(snap => {
      if (snap.exists() && snap.data().systemPrompt) {
        setSystemPrompt(snap.data().systemPrompt)
        prevValue.current = snap.data().systemPrompt
      }
    })
  }, [user])

  useEffect(() => {
    if (systemPrompt === prevValue.current) return
    if (!user) return
    setStatus('saving')
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      try {
        const db = getFirestore()
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, { systemPrompt })
        setStatus('saved')
        prevValue.current = systemPrompt
      } catch (e) {
        setStatus('error')
        setError(e)
        toast.error('Failed to save system prompt')
      }
    }, 1000)
    return () => clearTimeout(saveTimeout.current)
  }, [systemPrompt, user])

  useEffect(() => {
    if (!user) return
    const cached = JSON.parse(localStorage.getItem('user_quota') || '{}')
    if (typeof cached.resetAt === 'number') setResetAt(cached.resetAt)
    const db = getFirestore()
    const userRef = doc(db, 'users', user.uid)
    let unsub = false
    async function fetchQuota() {
      const snap = await getDoc(userRef)
      if (!unsub) {
        const data = snap.exists() ? snap.data() : {}
        setMessagesLeft(typeof data.messagesLeft === 'number' ? data.messagesLeft : 20)
        setResetAt(typeof data.resetAt === 'number' ? data.resetAt : null)
        localStorage.setItem('user_quota', JSON.stringify({ resetAt: data.resetAt }))
      }
    }
    fetchQuota()
    return () => { unsub = true }
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])


  let statusIcon = null
  if (status === 'saved') statusIcon = <Check size={16} className='text-green-500' />
  else if (status === 'saving') statusIcon = <Loader size={16} className='animate-spin text-blue-500' />


  return (
    <div className='main-bg flex justify-center items-center w-full min-h-screen'>
      <div className='absolute top-6 left-6 z-20'>
        <LiquidGlassButton
          onClick={() => navigate(-1)}
          icon={<ArrowLeft size={18} />}
          text={'Back'}
          variant={'rect'}
        />
      </div>
      <div className='w-full max-w-[1200px] flex flex-row bg-transparent rounded-xl shadow-none border-none min-h-[500px]'>
        {/* 247px is the width of the sidebar when user is loading.., yes i know its bad */}
        <div className={`flex flex-col items-center justify-start pt-16 px-10 bg-transparent relative ${loading || !user ? 'min-w-[220px]' : 'min-w-[220px]'} transition-all duration-300`} style={{minHeight:220}}>
          <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-400 ${loading || !user ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{zIndex:1}}>
            <div className='flex flex-col items-center w-full animate-pulse'>
              <div className='w-28 h-28 rounded-full bg-gray-200 dark:bg-[#232228] mb-3' />
              <div className='h-5 w-24 bg-gray-200 dark:bg-[#232228] rounded mb-2' />
              <div className='flex flex-col items-center gap-2 mt-2 w-full'>
                <div className='h-7 w-full bg-gray-200 dark:bg-[#232228] rounded mb-1' />
                <div className='h-7 w-full bg-gray-200 dark:bg-[#232228] rounded mb-1' />
                <div className='h-7 w-full bg-gray-200 dark:bg-[#232228] rounded' />
                <div className='w-full flex flex-col items-center mt-2'>
                  <div className='w-full h-2.5 rounded-full bg-gray-200 dark:bg-[#232228] mb-1' />
                  <div className='flex justify-between w-full mt-1 text-xs'>
                    <div className='h-4 w-16 bg-gray-200 dark:bg-[#232228] rounded' />
                    <div className='h-4 w-20 bg-gray-200 dark:bg-[#232228] rounded ml-2' />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-400 ${loading || !user ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`} style={{zIndex:2}}>
            {user && !loading && (
              <>
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className='w-28 h-28 rounded-full border border-gray-300 dark:border-[#3B3337] mb-3 object-cover'
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
                />
                <span className='text-base text-center text-[#0e0e10] dark:text-white font-semibold max-w-[140px] truncate'>{user.displayName}</span>
                <div className='flex flex-col items-center gap-2 mt-2 w-full'>
                  <button
                    className='flex items-center gap-2 px-3 py-1 rounded-md bg-[#f5f5fa] dark:bg-[#232228] text-xs text-[#0e0e10] dark:text-white hover:bg-[#ececec] dark:hover:bg-[#28262b] transition w-full justify-center'
                    onClick={() => {
                      navigator.clipboard.writeText(user.public_id)
                      toast.success('User ID copied!')
                    }}
                    type='button'
                  >
                    <Copy size={16} />
                    <span>Copy User ID</span>
                  </button>
                  <Button
                    variant='ghost'
                    className='flex items-center gap-2 w-full justify-center text-[#d32f2f] dark:text-[#ff6b81] mt-1'
                    type='button'
                    onClick={() => setShowSignOutDialog(true)}
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </Button>
                  <MessagesLeft messagesLeft={messagesLeft} resetAt={resetAt} now={now} />
                  <SignOutDialog
                    open={showSignOutDialog}
                    onOpenChange={setShowSignOutDialog}
                    loading={signingOut}
                    onConfirm={async () => {
                      setSigningOut(true)
                      try {
                        await signOutUser()
                        toast.success('Signed out')
                      } finally {
                        setSigningOut(false)
                        setShowSignOutDialog(false)
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <div className='flex-1 flex flex-col items-start justify-start pt-10 pl-8 pr-8 relative'>
          <SettingsTabs
            tabs={tabs}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
          <div className='w-full mt-8 min-h-[300px] min-w-[350px] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none'>
          {/* <div className='w-full mt-8 min-h-[300px] bg-white dark:bg-[#18171A] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col'> */}
          {activeIndex === 0 ? (
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
                      setStatus('saving')
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
              </div>
            ) : (
              tabContents[activeIndex]
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 