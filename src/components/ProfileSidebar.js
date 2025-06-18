import { useState, useEffect } from 'react'
import { Copy, LogOut, HardDrive, Ghost, Globe, Plus, Search } from 'lucide-react'
import { Button } from './ui/button'
import MessagesLeft from './MessagesLeft'
import SignOutDialog from './SignOutDialog'
import toast from 'react-hot-toast'
import Tooltip from './Tooltip'
import EditShortcutsDialog from './EditShortcutsDialog'
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore'
import { useIsMobile } from '../hooks/use-mobile'
import { useAuth } from '../AuthContext'
import { isMac, getModifierKey } from '../lib/utils'

function getShortcutsFromStorageOrUser(user) {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}')
  if (Array.isArray(userObj.shortcuts)) return userObj.shortcuts
  if (user && Array.isArray(user.shortcuts)) return user.shortcuts
  const modKey = getModifierKey();
  return [
    { keys: [modKey, 'M'], description: 'Select a model' },
    { keys: ['alt', 'T'], description: 'Temp chat' },
    { keys: ['alt', 'N'], description: 'New Chat' },
    { keys: ['alt', 'S'], description: 'Web Search' },
  ]
}

export default function ProfileSidebar({ user, loading, signOutUser, messagesLeft, resetAt, now }) {
  const isMobile = useIsMobile()
  const { setUser } = useAuth()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [tooltipAnchor, setTooltipAnchor] = useState(null)
  const [tooltipX, setTooltipX] = useState(0)
  const [tooltipY, setTooltipY] = useState(0)
  const [tooltipText, setTooltipText] = useState('')
  const [showEditShortcuts, setShowEditShortcuts] = useState(false)
  const [shortcuts, setShortcuts] = useState(getShortcutsFromStorageOrUser(user))

  useEffect(() => {
    setShortcuts(getShortcutsFromStorageOrUser(user))
  }, [user])

  if (loading || !user) {
    return (
      <div className={`${isMobile ? 'relative w-full h-auto flex flex-col items-center justify-center p-2' : 'absolute inset-0 w-full h-full flex flex-col items-center justify-center'} transition-opacity duration-400 opacity-100 pointer-events-auto`} style={isMobile ? {} : {zIndex:1}}>
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
    )
  }

  return (
    <div className={`${isMobile ? 'relative w-full h-auto flex flex-col items-center justify-center p-2' : 'absolute inset-0 w-full h-full flex flex-col items-center justify-center'} transition-opacity duration-400 opacity-100 pointer-events-auto`} style={isMobile ? {} : {zIndex:2}}>
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
        <MessagesLeft messagesLeft={user.status === 'premium' ? user.premiumTokens : messagesLeft} resetAt={resetAt} now={now} premium={user.status === 'premium'} />
        <SignOutDialog
          open={showSignOutDialog}
          onOpenChange={setShowSignOutDialog}
          loading={signingOut}
          onConfirm={async () => {
            setSigningOut(true)
            try {
              await signOutUser()
              localStorage.clear()
              toast.success('Signed out')
              window.location.reload()
            } finally {
              setSigningOut(false)
              setShowSignOutDialog(false)
            }
          }}
        />
      </div>
      {isMobile ? null : (
        <div className='w-full mt-6 flex flex-col gap-3 rounded-2xl border border-[#ececec] dark:border-[#232228] bg-gradient-to-br from-[#f5f5fa] to-[#ececec] dark:from-[#232228] dark:to-[#18171a] p-5 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-base font-bold text-[#0e0e10] dark:text-white tracking-tight'>Shortcuts</span>
          </div>
          <div className='flex flex-col gap-2'>
            {shortcuts.map((sc, i) => (
              <div key={i} className='flex flex-row items-center justify-between gap-4 group whitespace-nowrap'>
                <div className='flex flex-row items-center gap-2 flex-shrink-0'>
                  {sc.keys.map((k, idx) => (
                    <span key={idx} className='px-3 py-1 rounded-lg bg-[#ececec] dark:bg-[#232228] border border-[#d1b3c4] dark:border-[#a97ca5] font-mono text-base font-bold text-[#0e0e10] dark:text-white transition-all group-hover:scale-105 group-hover:bg-[#e3cdde] dark:group-hover:bg-[#2a1e2b]'>
                      {k.toLowerCase() === 'meta' || k.toLowerCase() === 'ctrl' ? (isMac() ? '⌘' : 'CTRL') : k.toUpperCase()}
                    </span>
                  ))}
                </div>
                <span
                  className='font-semibold text-[#6d4a6b] dark:text-[#e3cdde] text-sm text-right truncate max-w-[120px] relative flex items-center gap-1'
                  onMouseEnter={function(e) {
                    setTooltipAnchor('shortcut-' + i)
                    setTooltipX(e.clientX)
                    setTooltipY(e.clientY)
                    setTooltipText(sc.description)
                  }}
                  onMouseLeave={() => setTooltipAnchor(null)}
                >
                  {i === 0 ? <HardDrive size={24} /> : i === 1 ? <Ghost size={24} /> : i === 2 ? <Plus size={24} /> : i === 3 ? <Globe size={24} /> : i === 4 ? <Search size={24} /> : sc.description}
                  {tooltipAnchor === 'shortcut-' + i && (
                    <Tooltip x={tooltipX} y={tooltipY} text={tooltipText} />
                  )}
                </span>
              </div>
            ))}
            <Button
              variant='outline'
              className='mt-2 w-full flex items-center justify-center gap-2 text-[#6d4a6b] dark:text-[#e3cdde]'
              type='button'
              onClick={() => setShowEditShortcuts(true)}
            >
              Edit Shortcuts
            </Button>
            <EditShortcutsDialog
              open={showEditShortcuts}
              onOpenChange={setShowEditShortcuts}
              shortcuts={shortcuts}
              onSave={async (newShortcuts) => {
                try {
                  const db = getFirestore()
                  const userRef = doc(db, 'users', user.uid)
                  await updateDoc(userRef, { shortcuts: newShortcuts })
                  const userSnap = await getDoc(userRef)
                  let updatedUser = user
                  if (userSnap.exists()) {
                    updatedUser = { ...user, ...userSnap.data(), shortcuts: newShortcuts }
                  } else {
                    updatedUser = { ...user, shortcuts: newShortcuts }
                  }
                  setShortcuts(newShortcuts)
                  localStorage.setItem('user', JSON.stringify(updatedUser))
                  if (setUser) setUser(updatedUser)
                  toast.success('Shortcuts updated!')
                  setShowEditShortcuts(false)
                } catch (e) {
                  toast.error('Failed to save shortcuts')
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 