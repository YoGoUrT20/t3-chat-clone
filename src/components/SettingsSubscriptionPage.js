import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Check, Loader } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import LiquidGlassButton from './LiquidGlassButton'
import toast from 'react-hot-toast'
import SettingsTabs from './ui/SettingsTabs'
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import ProfileSidebar from './ProfileSidebar'
import Iso6391 from 'iso-639-1'
import SettingsProfileTab from './SettingsProfileTab'
import SettingsHistoryTab from './SettingsHistoryTab'
import { models } from '../models'
import SettingsCustomizeTab from './SettingsCustomizeTab'
import SettingsApiKeysTab from './SettingsApiKeysTab'
import SettingsSubscriptionTab from './SettingsSubscriptionTab'
import { useIsMobile } from '../hooks/use-mobile'
import styles from './ModelSelection.module.css'

const tabs = ['My Profile', 'Customize', 'Subscription', 'Api keys', 'History']

export default function SettingsSubscriptionPage() {
  const { user, signOutUser, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [status, setStatus] = useState('saved')
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
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem('chat_font') || 'Inter')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '')
  const [useOwnKey, setUseOwnKey] = useState(() => localStorage.getItem('use_own_api_key') === 'true')
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const isMobile = useIsMobile()
  const [banner, setBanner] = useState(null)
  const [bannerVisible, setBannerVisible] = useState(false)

  useEffect(() => {
    if (location.state?.selectedTab) {
      const tabIndex = tabs.indexOf(location.state.selectedTab)
      if (tabIndex !== -1) {
        setActiveIndex(tabIndex)
      }
    }
  }, [location.state])

  const handleSaveApiKey = async (key) => {
    setApiKeyLoading(true)
    try {
      if (user) {
        const res = await fetch(`${process.env.REACT_APP_FUNCTIONS_URL}/saveApiKey`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': user.apiKey,
          },
          body: JSON.stringify({ userId: user.uid, apiKey: key }),
        })
        if (!res.ok) throw new Error('Failed to save API key')
      }
      setApiKey(key)
      localStorage.setItem('openrouter_api_key', key)
      setUseOwnKey(true)
      setApiKeyLoading(false)
    } catch (e) {
      setApiKeyLoading(false)
      throw e
    }
  }

  const tabContents = [
    null,
    <SettingsCustomizeTab
      selectedFont={selectedFont}
      setSelectedFont={setSelectedFont}
    />,
    <SettingsSubscriptionTab user={user} />,
    <SettingsApiKeysTab
      user={user}
      apiKey={apiKey}
      setApiKey={setApiKey}
      onSaveApiKey={handleSaveApiKey}
      useOwnKey={useOwnKey}
      setUseOwnKey={setUseOwnKey}
      loading={apiKeyLoading}
    />,
    <SettingsHistoryTab 
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
  ]

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
  }, [user, location.key])

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
      const updateObj = { messagesLeft: 20, resetAt: newResetAt }
      if (user.status === 'premium') {
        updateObj.premiumTokens = 50
      }
      updateDoc(userRef, updateObj)
    }
  }, [user, resetAt, now])

  useEffect(() => {
    if (user && user.preferredLanguage) {
      setPreferredLanguage(user.preferredLanguage || '')
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
      if (user) {
        const db = getFirestore()
        const q = query(
          collection(db, 'conversations'),
          where('userId', '==', user.uid),
          orderBy('lastUsed', 'desc')
        )
        const snap = await getDocs(q)
        convos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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

  useEffect(() => {
    localStorage.setItem('chat_font', selectedFont)
  }, [selectedFont])

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

  useEffect(() => {
    localStorage.setItem('use_own_api_key', useOwnKey)
    if (user) {
      const db = getFirestore()
      const userRef = doc(db, 'users', user.uid)
      updateDoc(userRef, { useOwnKey })
    }
  }, [user, useOwnKey])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('success') === '1') {
      setBanner({ type: 'success', text: 'Subscription successful!' })
    } else if (params.get('canceled') === '1') {
      setBanner({ type: 'error', text: 'Process was canceled.' })
    } else {
      setBanner(null)
    }
  }, [location.search])

  useEffect(() => {
    if (banner) {
      setBannerVisible(true)
      const hideTimeout = setTimeout(() => setBannerVisible(false), 3700)
      const removeTimeout = setTimeout(() => setBanner(null), 4000)
      return () => {
        clearTimeout(hideTimeout)
        clearTimeout(removeTimeout)
      }
    } else {
      setBannerVisible(false)
    }
  }, [banner])

  const handleGoBack = () => {
    const prevPath = localStorage.getItem('prev_path')
    if (prevPath && /^\/chat\/.+/.test(prevPath)) {
      navigate(prevPath)
    } else {
      navigate('/')
    }
  }

  let statusIcon = null
  if (status === 'saved') statusIcon = <Check size={16} className='text-green-500' />
  else if (status === 'saving') statusIcon = <Loader size={16} className='animate-spin text-blue-500' />

  return (
    <>
      {banner && (
        <div className='fixed top-4 left-1/2 z-[100] w-full flex items-center justify-center pointer-events-none' style={{ transform: 'translateX(-50%)', maxWidth: '100vw' }}>
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow border border-[#ececec] dark:border-[#232228] ${styles.liquidGlassBg} transition-all duration-500 ease-in-out ${bannerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
            style={{ minWidth: 0, maxWidth: 420, pointerEvents: 'auto' }}
          >
            {banner.type === 'success' && (
              <Check size={20} className='text-green-400 flex-shrink-0' />
            )}
            {banner.type === 'error' && (
              <Loader size={20} className='text-red-400 animate-spin flex-shrink-0' />
            )}
            <span className='text-base font-bold truncate' style={{ maxWidth: 260, color: '#F2EBFA' }}>{banner.text}</span>
          </div>
        </div>
      )}
      <div className={`${isMobile ? 'absolute top-2 left-2 z-30' : 'fixed top-6 left-6 z-30'}`}>
        <LiquidGlassButton
          onClick={handleGoBack}
          icon={<ArrowLeft size={18} />}
          text={'Back'}
          variant={'rect'}
        />
      </div>
      <div className={`main-bg flex ${isMobile ? 'flex-col items-stretch min-h-screen' : 'justify-center items-start w-full min-h-screen'} `} style={isMobile ? {} : { minHeight: '130vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div className={`w-full ${isMobile ? 'max-w-full flex flex-col bg-transparent rounded-none shadow-none border-none min-h-0 mt-0' : 'max-w-[1200px] flex flex-row bg-transparent rounded-xl shadow-none border-none min-h-[500px] mt-80'}`}>
          <div className={`${isMobile ? 'w-full flex flex-col items-center justify-start bg-transparent relative min-w-0 mt-0 static' : 'flex flex-col items-center justify-start bg-transparent relative min-w-[220px] transition-all duration-300 mt-32'} `} style={isMobile ? {} : { minHeight: 220, position: 'sticky', top: 200, alignSelf: 'flex-start' }}>
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
          <div className={`${isMobile ? 'w-full flex flex-col items-start justify-start p-2 relative' : 'flex-1 flex flex-col items-start justify-start pl-8 pr-8 relative'}`}>
            <div className='w-full'>
              <SettingsTabs
                tabs={tabs}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
              />
              <div
                className={`w-full mt-4 ${isMobile ? 'min-h-[200px] min-w-0 rounded-lg shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none' : 'mt-8 min-h-[300px] min-w-[350px] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none'}`}
                style={isMobile ? { overflow: 'hidden' } : { height: containerHeight, transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}
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
    </>
  )
} 