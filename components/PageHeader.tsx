'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBackClick?: () => void
  rightAction?: React.ReactNode
  icon?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  onBackClick,
  rightAction,
  icon
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b border-white/5 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Sol taraf: Geri butonu + Başlık */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
                <h1 className="text-xl lg:text-2xl font-black text-white truncate">
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className="text-xs lg:text-sm text-white/40 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Sağ taraf: Action */}
          {rightAction && (
            <div className="flex-shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
