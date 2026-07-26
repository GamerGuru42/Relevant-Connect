'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, ChevronDown, Search, Type } from 'lucide-react'

const BIBLE_BOOKS = {
  'Old Testament': [
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
    '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles',
    'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes',
    'Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
    'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk',
    'Zephaniah','Haggai','Zechariah','Malachi'
  ],
  'New Testament': [
    'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
    'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
    '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
    '1 John','2 John','3 John','Jude','Revelation'
  ]
}

const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis':50,'Exodus':40,'Leviticus':27,'Numbers':36,'Deuteronomy':34,'Joshua':24,
  'Judges':21,'Ruth':4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,
  '1 Chronicles':29,'2 Chronicles':36,'Ezra':10,'Nehemiah':13,'Esther':10,'Job':42,
  'Psalms':150,'Proverbs':31,'Ecclesiastes':12,'Song of Solomon':8,'Isaiah':66,
  'Jeremiah':52,'Lamentations':5,'Ezekiel':48,'Daniel':12,'Hosea':14,'Joel':3,
  'Amos':9,'Obadiah':1,'Jonah':4,'Micah':7,'Nahum':3,'Habakkuk':3,'Zephaniah':3,
  'Haggai':2,'Zechariah':14,'Malachi':4,'Matthew':28,'Mark':16,'Luke':24,'John':21,
  'Acts':28,'Romans':16,'1 Corinthians':16,'2 Corinthians':13,'Galatians':6,
  'Ephesians':6,'Philippians':4,'Colossians':4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,'Titus':3,'Philemon':1,'Hebrews':13,'James':5,
  '1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,'3 John':1,'Jude':1,'Revelation':22
}

const VERSIONS = [
  { id: 'niv', label: 'NIV', full: 'New International Version' },
  { id: 'kjv', label: 'KJV', full: 'King James Version' },
  { id: 'web', label: 'WEB', full: 'World English Bible' },
  { id: 'asv', label: 'ASV', full: 'American Standard Version' },
  { id: 'bbe', label: 'BBE', full: 'Bible in Basic English' },
  { id: 'darby', label: 'Darby', full: 'Darby Translation' },
  { id: 'ylt', label: 'YLT', full: "Young's Literal Translation" },
]

const FONT_SIZES = [
  { label: 'S', size: 'text-sm leading-7' },
  { label: 'M', size: 'text-base leading-8' },
  { label: 'L', size: 'text-lg leading-9' },
  { label: 'XL', size: 'text-xl leading-10' },
]

interface BibleVerse {
  book_name: string
  chapter: number
  verse: number
  text: string
}

export function BibleReader() {
  const [book, setBook] = useState('Genesis')
  const [chapter, setChapter] = useState(1)
  const [version, setVersion] = useState('niv') // Default to NIV as requested
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [showVersionPicker, setShowVersionPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fontSizeIdx, setFontSizeIdx] = useState(1) // default Medium

  // Persist last reading position & font size
  useEffect(() => {
    const saved = localStorage.getItem('bible-reading-position')
    if (saved) {
      try {
        const { book: b, chapter: c, version: v } = JSON.parse(saved)
        setBook(b)
        setChapter(c)
        setVersion(v)
      } catch { /* ignore */ }
    }
    const savedFont = localStorage.getItem('bible-font-size')
    if (savedFont) setFontSizeIdx(Number(savedFont))
  }, [])

  const fetchChapter = useCallback(async () => {
    setLoading(true)
    try {
      if (version === 'niv') {
        const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']]
        const bookIndex = allBooks.indexOf(book) + 1
        const res = await fetch(`https://bolls.life/get-chapter/NIV/${bookIndex}/${chapter}/`)
        if (!res.ok) throw new Error('Failed to fetch NIV')
        const data = await res.json()
        const mappedVerses = data.map((v: any) => ({
          book_name: book,
          chapter: chapter,
          verse: v.verse,
          text: v.text.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim()
        }))
        setVerses(mappedVerses)
      } else {
        const res = await fetch(
          `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${version}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (data.verses) {
          setVerses(data.verses)
        } else if (data.text) {
          setVerses([{ book_name: book, chapter, verse: 1, text: data.text }])
        }
      }
      localStorage.setItem('bible-reading-position', JSON.stringify({ book, chapter, version }))
    } catch (err) {
      console.error('Bible fetch error:', err)
      const cached = localStorage.getItem(`bible-${version}-${book}-${chapter}`)
      if (cached) {
        setVerses(JSON.parse(cached))
      } else {
        setVerses([{ book_name: book, chapter, verse: 0, text: 'Unable to load this chapter. Please check your internet connection and try again.' }])
      }
    } finally {
      setLoading(false)
    }
  }, [book, chapter, version])

  useEffect(() => {
    fetchChapter()
  }, [fetchChapter])

  // Cache verses for offline use
  useEffect(() => {
    if (verses.length > 0 && verses[0].verse !== 0) {
      localStorage.setItem(`bible-${version}-${book}-${chapter}`, JSON.stringify(verses))
    }
  }, [verses, version, book, chapter])

  const maxChapters = CHAPTER_COUNTS[book] || 1

  const goToNextChapter = () => {
    if (chapter < maxChapters) {
      setChapter(chapter + 1)
    } else {
      const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']]
      const idx = allBooks.indexOf(book)
      if (idx < allBooks.length - 1) {
        setBook(allBooks[idx + 1])
        setChapter(1)
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goPrevChapter = () => {
    if (chapter > 1) {
      setChapter(chapter - 1)
    } else {
      const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']]
      const idx = allBooks.indexOf(book)
      if (idx > 0) {
        const prevBook = allBooks[idx - 1]
        setBook(prevBook)
        setChapter(CHAPTER_COUNTS[prevBook] || 1)
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeFontSize = (idx: number) => {
    setFontSizeIdx(idx)
    localStorage.setItem('bible-font-size', String(idx))
  }

  const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']]
  const filteredBooks = searchQuery
    ? allBooks.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  const currentFontClass = FONT_SIZES[fontSizeIdx]?.size || FONT_SIZES[1].size

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        {/* Top Bar */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowBookPicker(!showBookPicker)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-card border border-border rounded-xl text-sm font-semibold hover:border-primary/50 transition-colors truncate max-w-[200px] sm:max-w-none"
              >
                <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="truncate">{book} {chapter}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>

              <div className="flex items-center gap-2">
                {/* Font Size Control */}
                <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-xl p-1">
                  <Type className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
                  {FONT_SIZES.map((fs, idx) => (
                    <button
                      key={fs.label}
                      onClick={() => changeFontSize(idx)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                        fontSizeIdx === idx
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowVersionPicker(!showVersionPicker)}
                  className="px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
                >
                  {VERSIONS.find(v => v.id === version)?.label || 'KJV'}
                </button>
              </div>
            </div>

            {/* Mobile Font Size Control */}
            <div className="flex sm:hidden items-center gap-1 mt-2 bg-card border border-border rounded-xl p-1 w-fit">
              <Type className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
              {FONT_SIZES.map((fs, idx) => (
                <button
                  key={fs.label}
                  onClick={() => changeFontSize(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    fontSizeIdx === idx
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version Picker Modal */}
        <AnimatePresence>
          {showVersionPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
              onClick={() => setShowVersionPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-bold text-lg mb-4">Select Translation</h3>
                <div className="space-y-2">
                  {VERSIONS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setVersion(v.id); setShowVersionPicker(false) }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                        version === v.id ? 'bg-primary text-white' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="font-bold">{v.label}</span>
                      <span className="text-sm ml-2 opacity-70">{v.full}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Book Picker Modal */}
        <AnimatePresence>
          {showBookPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
              onClick={() => setShowBookPicker(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-lg mb-3">Select Book &amp; Chapter</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  {filteredBooks ? (
                    <div className="space-y-1">
                      {filteredBooks.map(b => (
                        <button
                          key={b}
                          onClick={() => { setBook(b); setChapter(1); setShowBookPicker(false); setSearchQuery('') }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium ${
                            book === b ? 'bg-primary text-white' : 'hover:bg-muted'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  ) : (
                    Object.entries(BIBLE_BOOKS).map(([testament, books]) => (
                      <div key={testament} className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{testament}</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {books.map(b => (
                            <button
                              key={b}
                              onClick={() => { setBook(b); setShowBookPicker(false); setSearchQuery('') }}
                              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                book === b ? 'bg-primary text-white' : 'hover:bg-muted'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Chapter picker when book is selected */}
                  {!searchQuery && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        {book} — Chapters
                      </h4>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {Array.from({ length: maxChapters }, (_, i) => i + 1).map(c => (
                          <button
                            key={c}
                            onClick={() => { setChapter(c); setShowBookPicker(false) }}
                            className={`w-full aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                              chapter === c ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reading Area */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">Loading scripture...</p>
            </div>
          ) : (
            <motion.div
              key={`${book}-${chapter}-${version}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Chapter Header */}
              <div className="mb-8 sm:mb-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{book}</h2>
                <p className="text-muted-foreground text-sm mt-1 font-medium">Chapter {chapter}</p>
                <div className="w-12 h-1 bg-primary/30 rounded-full mx-auto mt-3" />
              </div>

              {/* Verses — each verse on its own line for clarity */}
              <div className="space-y-4">
                {verses.map((v) => (
                  <p key={v.verse} className={`${currentFontClass} text-foreground/90 font-[420]`}>
                    {v.verse > 0 && (
                      <sup className="text-primary font-bold text-[0.65em] mr-1.5 select-none align-top">{v.verse}</sup>
                    )}
                    {v.text.trim()}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 sm:mt-16 pt-6 border-t border-border">
            <button
              onClick={goPrevChapter}
              className="flex items-center gap-1.5 px-3 py-2.5 sm:px-4 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-muted-foreground font-medium">
              {chapter} / {maxChapters}
            </span>
            <button
              onClick={goToNextChapter}
              className="flex items-center gap-1.5 px-3 py-2.5 sm:px-4 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
