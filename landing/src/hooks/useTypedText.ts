import { useEffect, useState } from 'react'

const phrases = [
  'propiedad intelectual',
  'portfolio global',
  'ventaja competitiva',
]

export function useTypedText() {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting && text === current) {
      timeout = setTimeout(() => setIsDeleting(true), 3000)
    } else if (isDeleting && text === '') {
      setIsDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
      timeout = setTimeout(() => {}, 500)
    } else {
      const speed = isDeleting ? 30 : 50
      timeout = setTimeout(() => {
        setText(isDeleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1))
      }, speed)
    }

    return () => clearTimeout(timeout)
  }, [text, phraseIndex, isDeleting])

  return text
}
