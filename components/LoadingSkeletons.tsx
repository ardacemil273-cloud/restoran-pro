'use client'
import { motion } from 'framer-motion'

export function CardSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-zinc-800 rounded-lg p-4 space-y-3"
    >
      <div className="h-4 bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-zinc-700 rounded w-1/2" />
      <div className="h-8 bg-zinc-700 rounded" />
    </motion.div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="flex gap-4 p-4 bg-zinc-800 rounded-lg"
        >
          <div className="h-4 bg-zinc-700 rounded w-1/4" />
          <div className="h-4 bg-zinc-700 rounded w-1/3" />
          <div className="h-4 bg-zinc-700 rounded w-1/4" />
          <div className="h-4 bg-zinc-700 rounded w-1/6" />
        </motion.div>
      ))}
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="bg-zinc-800 rounded-lg p-4 space-y-3"
        >
          <div className="h-32 bg-zinc-700 rounded" />
          <div className="h-4 bg-zinc-700 rounded w-3/4" />
          <div className="h-3 bg-zinc-700 rounded w-1/2" />
        </motion.div>
      ))}
    </div>
  )
}

export function LineSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="space-y-2"
    >
      <div className="h-4 bg-zinc-700 rounded w-full" />
      <div className="h-4 bg-zinc-700 rounded w-5/6" />
      <div className="h-4 bg-zinc-700 rounded w-4/5" />
    </motion.div>
  )
}

export function CircleSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="w-12 h-12 bg-zinc-700 rounded-full"
    />
  )
}
