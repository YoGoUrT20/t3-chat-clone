import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Check, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import LiquidGlassButton from './LiquidGlassButton'
import toast from 'react-hot-toast'
import SettingsTabs from './ui/SettingsTabs'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import ProfileSidebar from './ProfileSidebar'
import Iso6391 from 'iso-639-1'
import SettingsProfileTab from './SettingsProfileTab'
import SettingsHistoryTab from './SettingsHistoryTab'
import { models } from '../models'

const tabs = ['My Profile', 'Customize', 'Subscription', 'Security', 'Help', 'History']

const tabContents = [
  null,
  <div className='p-6'>Customize content</div>,
  <div className='p-6'>Subscription content</div>,
  <div className='p-6'>Security content</div>,
  <div className='p-6'>Help content</div>,
  null,
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
  const [messagesLeft, setMessagesLeft] = useState(20)
  const [resetAt, setResetAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem('user_language') || ''
  })
  const [userStats, setUserStats] = useState(() => {
    const cached = localStorage.getItem('user_stats')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return { totalTokens: 0, totalMessages: 0, totalImages: 0 }
      }
    }
    return { totalTokens: 0, totalMessages: 0, totalImages: 0 }
  })
  const [exportFormat, setExportFormat] = useState('json')
  const [conversations, setConversations] = useState([])
  const [filterConversationId, setFilterConversationId] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [reasoningEnabled, setReasoningEnabled] = useState(false)
  const contentRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState('auto')
  const [defaultModel, setDefaultModel] = useState(() => localStorage.getItem('default_model') || models[0].name)

  useEffect(() => {
    if (!user) return
    const db = getFirestore()
    const userRef = doc(db, 'users', user.uid)
    getDoc(userRef).then(snap => {
      if (snap.exists() && snap.data().systemPrompt) {
        setSystemPrompt(snap.data().systemPrompt)
        prevValue.current = snap.data().systemPrompt
      }
      if (snap.exists() && typeof snap.data().reasoningEnabled === 'boolean') {
        setReasoningEnabled(snap.data().reasoningEnabled)
      }
      if (snap.exists() && snap.data().defaultModel) {
        setDefaultModel(snap.data().defaultModel)
        localStorage.setItem('default_model', snap.data().defaultModel)
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
        setUserStats({
          totalTokens: typeof data.totalTokens === 'number' ? data.totalTokens : 0,
          totalMessages: typeof data.totalMessages === 'number' ? data.totalMessages : 0,
          totalImages: typeof data.totalImages === 'number' ? data.totalImages : 0,
        })
        localStorage.setItem('user_stats', JSON.stringify({
          totalTokens: typeof data.totalTokens === 'number' ? data.totalTokens : 0,
          totalMessages: typeof data.totalMessages === 'number' ? data.totalMessages : 0,
          totalImages: typeof data.totalImages === 'number' ? data.totalImages : 0,
        }))
      }
    }
    fetchQuota()
    return () => { unsub = true }
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user || !resetAt || !now) return
    if (now > resetAt) {
      const db = getFirestore()
      const userRef = doc(db, 'users', user.uid)
      const newResetAt = now + 8 * 60 * 60 * 1000
      setMessagesLeft(20)
      setResetAt(newResetAt)
      localStorage.setItem('user_quota', JSON.stringify({ resetAt: newResetAt }))
      updateDoc(userRef, { messagesLeft: 20, resetAt: newResetAt })
    }
  }, [user, resetAt, now])

  useEffect(() => {
    if (user && user.preferredLanguage) {
      setPreferredLanguage(
        Iso6391.getAllCodes().find(
          code => Iso6391.getName(code) === user.preferredLanguage
        ) || ''
      )
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to continue')
      navigate('/')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    async function fetchConvos() {
      setLoadingConvos(true)
      let convos = []
      const cached = JSON.parse(localStorage.getItem('conversations') || '{}')
      if (user) {
        const db = getFirestore()
        const qSnap = await getDoc(doc(db, 'users', user.uid))
        if (qSnap.exists()) {
          // Optionally fetch from Firestore if needed
        }
        convos = Object.values(cached).filter(c => c.userId === user.uid)
      } else {
        convos = Object.values(cached)
      }
      setConversations(convos)
      setLoadingConvos(false)
    }
    fetchConvos()
  }, [user])

  useEffect(() => {
    if (contentRef.current) {
      setContainerHeight(contentRef.current.offsetHeight + 'px')
    }
  }, [activeIndex, systemPrompt, preferredLanguage, reasoningEnabled, exportFormat, filterConversationId, filterStartDate, filterEndDate, conversations, loadingConvos])

  const handleDefaultModelChange = async (modelName) => {
    setDefaultModel(modelName)
    localStorage.setItem('default_model', modelName)
    if (user) {
      const db = getFirestore()
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { defaultModel: modelName })
      toast.success('Default model updated!')
    }
  }

  let statusIcon = null
  if (status === 'saved') statusIcon = <Check size={16} className='text-green-500' />
  else if (status === 'saving') statusIcon = <Loader size={16} className='animate-spin text-blue-500' />

  tabContents[6] = <SettingsHistoryTab 
    exportFormat={exportFormat}
    setExportFormat={setExportFormat}
    filterConversationId={filterConversationId}
    setFilterConversationId={setFilterConversationId}
    filterStartDate={filterStartDate}
    setFilterStartDate={setFilterStartDate}
    filterEndDate={filterEndDate}
    setFilterEndDate={setFilterEndDate}
    conversations={conversations}
    loadingConvos={loadingConvos}
  />

  return (
    <div className='main-bg flex justify-center items-start w-full min-h-screen' style={{ minHeight: '130vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className='absolute top-6 left-6 z-20'>
        <LiquidGlassButton
          onClick={() => navigate(-1)}
          icon={<ArrowLeft size={18} />}
          text={'Back'}
          variant={'rect'}
        />
      </div>
      <div className='w-full max-w-[1200px] flex flex-row bg-transparent rounded-xl shadow-none border-none min-h-[500px] mt-80'>
        <div className={`flex flex-col items-center justify-start bg-transparent relative ${loading || !user ? 'min-w-[220px]' : 'min-w-[220px]'} transition-all duration-300 mt-32`} style={{ minHeight: 220, position: 'sticky', top: 72, alignSelf: 'flex-start' }}>
          <ProfileSidebar
            user={user}
            loading={loading}
            signOutUser={async () => {
              await signOutUser()
              toast.success('Signed out')
              navigate('/')
            }}
            messagesLeft={messagesLeft}
            resetAt={resetAt}
            now={now}
          />
        </div>
        <div className='flex-1 flex flex-col items-start justify-start pl-8 pr-8 relative'>
          <div className='w-full'>
            <SettingsTabs
              tabs={tabs}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
            <div
              className='w-full mt-8 min-h-[300px] min-w-[350px] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none'
              style={{
                height: containerHeight,
                transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
              }}
            >
              <div ref={contentRef}>
                {activeIndex === 0 ? (
                  <SettingsProfileTab
                    systemPrompt={systemPrompt}
                    setSystemPrompt={value => {
                      setSystemPrompt(value)
                      setStatus('saving')
                    }}
                    status={status}
                    statusIcon={statusIcon}
                    showTooltip={showTooltip}
                    setShowTooltip={setShowTooltip}
                    tooltipX={tooltipX}
                    setTooltipX={setTooltipX}
                    tooltipY={tooltipY}
                    setTooltipY={setTooltipY}
                    preferredLanguage={preferredLanguage}
                    setPreferredLanguage={setPreferredLanguage}
                    user={user}
                    userStats={userStats}
                    reasoningEnabled={reasoningEnabled}
                    setReasoningEnabled={setReasoningEnabled}
                    onLanguageChange={async code => {
                      if (!user) return
                      const db = getFirestore()
                      const userRef = doc(db, 'users', user.uid)
                      const langName = Iso6391.getName(code) || ''
                      await updateDoc(userRef, { preferredLanguage: langName })
                      setPreferredLanguage(code)
                      localStorage.setItem('user_language', code)
                      toast.success('Preferred language updated!')
                    }}
                    onReasoningChange={async checked => {
                      setReasoningEnabled(checked)
                      if (user) {
                        const db = getFirestore()
                        const userRef = doc(db, 'users', user.uid)
                        await updateDoc(userRef, { reasoningEnabled: checked })
                        toast.success(checked ? 'Model reasoning enabled!' : 'Model reasoning disabled!')
                      }
                    }}
                    defaultModel={defaultModel}
                    setDefaultModel={setDefaultModel}
                    onDefaultModelChange={handleDefaultModelChange}
                  />
                ) : (
                  tabContents[activeIndex]
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 