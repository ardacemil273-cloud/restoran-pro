'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

type SmoothAccordionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  onOpen?: () => void
}

export default function SmoothAccordion({
  title,
  children,
  defaultOpen = false,
  icon,
  onOpen
}: SmoothAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isOpen, children])

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    
    // Açılırken callback çalıştır
    if (newState && onOpen) {
      onOpen()
    }

    // Scroll resetlenmesini önle
    window.scrollTo({
      top: window.scrollY,
      behavior: 'auto'
    })
  }

  return (
    <div className="border border-cyan-500/30 rounded-xl overflow-hidden bg-cyan-500/5 hover:bg-cyan-500/10 transition-all">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-cyan-400">{icon}</div>}
          <span className="font-bold text-white">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: contentHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-cyan-500/30"
          >
            <div ref={contentRef} className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
