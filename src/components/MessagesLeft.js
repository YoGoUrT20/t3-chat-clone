import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'

function pad(num) {
  return num.toString().padStart(2, '0')
}

export default function MessagesLeft({ messagesLeft, resetAt, now, premium }) {
  const { timeLeft, hours, minutes, seconds } = useMemo(() => {
    let timeLeft = resetAt ? Math.max(0, resetAt - now) : 0
    let hours = Math.floor(timeLeft / 3600000)
    let minutes = Math.floor((timeLeft % 3600000) / 60000)
    let seconds = Math.floor((timeLeft % 60000) / 1000)
    return { timeLeft, hours, minutes, seconds }
  }, [resetAt, now])

  const modernGradient = 'linear-gradient(90deg, #7f5fff 0%, #5f8fff 25%, #38bdf8 50%, #e879f9 75%, #f472b6 100%)'

  if (premium) {
    if (messagesLeft > 0 && messagesLeft <= 50) {
      return (
        <div className='w-full flex flex-col items-center mt-2'>
          <div className='w-full h-2.5 rounded-full border border-[#e0c7d6] dark:border-[#3B3337] shadow-sm relative overflow-hidden' style={{backdropFilter:'blur(4px)'}}>
            <div
              className='h-2.5 rounded-full transition-all duration-500'
              style={{
                width: `${Math.max(0, Math.min(1, messagesLeft / 50)) * 100}%`,
                background: modernGradient,
                boxShadow: '0 1px 8px 0 #eec1e6',
              }}
            />
          </div>
          <div className='flex justify-between w-full mt-1 text-xs text-[#90808A] dark:text-[#bdbdbd] font-medium' style={{letterSpacing:'0.01em'}}>
            <span className='flex items-center gap-1'><Sparkles size={14} />{messagesLeft} / 50 premium left</span>
            <span style={{marginLeft:'12px'}}>
              {resetAt && timeLeft > 0 ? `Resets in ${hours}:${pad(minutes)}:${pad(seconds)}` : resetAt ? 'Resets soon' : ''}
            </span>
          </div>
          <div className='w-full flex justify-center mt-1 text-xs text-[#38bdf8] dark:text-[#e879f9] font-semibold'>
            Premium models only. Free models are unlimited.
          </div>
        </div>
      )
    }
    return (
      <div className='w-full flex flex-col items-center mt-2'>
        <div className='w-full h-2.5 rounded-full border border-[#e0c7d6] dark:border-[#3B3337] shadow-sm relative overflow-hidden' style={{backdropFilter:'blur(4px)'}}>
          <div
            className='h-2.5 rounded-full transition-all duration-500'
            style={{
              width: '100%',
              background: modernGradient,
              opacity: 0.7,
              boxShadow: '0 1px 8px 0 #eec1e6',
            }}
          />
        </div>
        <div className='flex justify-between w-full mt-1 text-xs text-[#38bdf8] dark:text-[#e879f9] font-semibold' style={{letterSpacing:'0.01em'}}>
          <span className='flex items-center gap-1'><Sparkles size={14} />Unlimited access to free models</span>
        </div>
        <div className='w-full flex justify-center mt-1 text-xs text-[#90808A] dark:text-[#bdbdbd] font-medium'>
          Premium models quota used. Free models are unlimited.
        </div>
        <div className='w-full flex justify-center mt-1 text-xs text-[#90808A] dark:text-[#bdbdbd] font-medium'>
          {resetAt && timeLeft > 0 ? `Premium resets in ${hours}:${pad(minutes)}:${pad(seconds)}` : resetAt ? 'Premium resets soon' : ''}
        </div>
      </div>
    )
  }

  return (
    <div className='w-full flex flex-col items-center mt-2'>
      <div className='w-full h-2.5 rounded-full bg-[#f5f5fa] dark:bg-[#232228] border border-[#e0c7d6] dark:border-[#3B3337] shadow-sm relative overflow-hidden' style={{backdropFilter:'blur(4px)'}}>
        <div
          className='h-2.5 rounded-full bg-gradient-to-r from-pink-400/80 to-pink-600/90 transition-all duration-500'
          style={{ width: `${Math.max(0, Math.min(1, messagesLeft / 20)) * 100}%`, boxShadow: '0 1px 8px 0 #eec1e6' }}
        />
      </div>
      <div className='flex justify-between w-full mt-1 text-xs text-[#90808A] dark:text-[#bdbdbd] font-medium' style={{letterSpacing:'0.01em'}}>
        <span>{messagesLeft} / 20 left</span>
        <span style={{marginLeft:'12px'}}>
          {resetAt && timeLeft > 0 ? `Resets in ${hours}:${pad(minutes)}:${pad(seconds)}` : resetAt ? 'Resets soon' : ''}
        </span>
      </div>
    </div>
  )
} 