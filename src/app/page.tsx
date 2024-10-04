'use client'

import { useState, useEffect, useRef } from 'react'
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder'
import { MicrophoneIcon, DocumentTextIcon, PauseIcon, PlayIcon, ArrowPathIcon, PauseCircleIcon } from '@heroicons/react/24/solid'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [convertedText, setConvertedText] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const recorderControls = useAudioRecorder()

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resetTimer = () => {
    stopTimer()
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob)
    resetTimer()
  }

  const handleStartRecording = () => {
    setIsRecording(true)
    setIsPaused(false)
    setAudioBlob(null)
    recorderControls.startRecording()
    startTimer()
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    recorderControls.stopRecording()
    stopTimer()
  }

  const handlePauseResumeRecording = () => {
    if (isPaused) {
      recorderControls.startRecording()
      startTimer()
    } else {
      recorderControls.stopRecording()
      stopTimer()
    }
    setIsPaused(!isPaused)
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTranscribe = async () => {
    if (!audioBlob) return

    setIsLoading(true)
    const formData = new FormData()
    const fileName = `audio-${Date.now()}`
    formData.append('file', audioBlob, fileName)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      setTranscription(data.text)
    } catch (error) {
      console.error('Error:', error)
      setTranscription('Transcription failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConvert = async (format: string) => {
    setIsConverting(true)
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcription, format }),
      })

      if (!response.ok) {
        throw new Error('Conversion failed')
      }

      const data = await response.json()
      setConvertedText(data.convertedText)
    } catch (error) {
      console.error('Error:', error)
      setConvertedText('Conversion failed. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  useEffect(() => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => setIsPlaying(false)
      }
      return () => URL.revokeObjectURL(audioUrl)
    }
  }, [audioBlob])

  return (
    <main className="p-4">
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='flex h-screen flex-col justify-center item-center text-center py-2'>
          <h1 className="text-4xl font-bold mb-8 dark:text-white">AI Voice Notes</h1>
          <div className="flex flex-col items-center space-y-4">
            <div className='hidden'>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                recorderControls={recorderControls}
                showVisualizer={true}
                audioTrackConstraints={{
                  noiseSuppression: true,
                  echoCancellation: true,
                }}

              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={` w-12 h-12 flex justify-center items-center rounded-full shadow-md ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white'
                  } text-white`}
              >
                {isRecording ? <PauseCircleIcon className={`h-6 w-6 text-white`} /> : <MicrophoneIcon className={`h-6 w-6 text-red-500`} />}
              </button>
            </div>
            {!isPlaying && (
              <>
                <div className="flex items-center space-x-2">

                  <span className='text-xs dark:text-white'>{isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}</span>
                </div>
                <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
              </>)
            }
          </div>
          {audioBlob && (
            <div className="mt-2 flex flex-col items-center space-y-4">
              <audio ref={audioRef} className="hidden" />
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 pl-1  shadow-md rounded-full bg-white  text-black"
              >
                {isPlaying ? (
                  <><PauseIcon className="h-5 w-5 inline-block mr-1" /></>
                ) : (
                  <><PlayIcon className="h-5 w-5 inline-block mr-1" /> </>
                )}
              </button>
              <button
                onClick={handleTranscribe}
                className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isLoading ? 'Transcribing...' : 'Transcribe'}
              </button>
            </div>
          )}
        </div>
        <div className='flex h-screen flex-col justify-center item-center text-center py-2'>
          <div className=" w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Transcription
            </h2>
            {isLoading ? (
              <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
            ) : (
              <textarea
                className="w-full h-32 p-2 border border-slate-800 dark:text-gray-200 bg-transparent overflow-y-scroll rounded resize-none"
                value={transcription}
                readOnly
              />
            )}
          </div>

          {transcription && (
            <div className="mt-8 w-full max-w-2xl">
              <div className="flex items-center space-x-4">
                <select
                  className="p-2 border border-gray-300 dark:text-gray-700 rounded focus:outline-none"
                  onChange={(e) => handleConvert(e.target.value)}
                  defaultValue=""
                >
                  <option label="Select format"></option>
                  <option value="journal">Journal</option>
                  <option value="article">Article</option>
                  <option value="note">Note</option>
                  <option value="tweet">Tweet</option>
                  <option value="todo">To-Do List</option>
                </select>
                <button
                  onClick={() => handleConvert('journal')}
                  className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <ArrowPathIcon className="h-5 w-5 inline-block animate-spin" />
                  ) : (
                    'Convert'
                  )}
                </button>
              </div>
              {convertedText && (
                <div className="mt-4 bg-transparent">

                  <div
                    className="w-full text-left h-full overflow-y-scroll p-2 isolate aspect-video border border-gray-300 dark:border-slate-800  rounded-xl dark:bg-slate-900/20 shadow dark:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: convertedText }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}