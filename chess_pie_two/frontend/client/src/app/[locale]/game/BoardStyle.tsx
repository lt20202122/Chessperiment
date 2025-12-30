"use client"

import * as React from "react"
import { CheckIcon, Crown } from "lucide-react"
import { useTranslations } from "next-intl"

const styles = [
  { id: "v2", name: "Classic" },
  { id: "v3", name: "Modern" }
]

interface BoardStyleProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export default function BoardStyle({ currentStyle, onStyleChange }: BoardStyleProps) {
  const t = useTranslations('Game')

  return (
    <div className="w-full">
      <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
        <Crown className="w-3.5 h-3.5" />
        Piece Style
      </label>

      <div className="inline-flex rounded-lg border border-gray-200 dark:border-stone-700 p-0.5 bg-gray-50 dark:bg-stone-900">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`
              relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150
              ${currentStyle === style.id
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            {currentStyle === style.id && (
              <CheckIcon className="w-3 h-3 inline mr-1" />
            )}
            {style.name}
          </button>
        ))}
      </div>
    </div>
  )
}
