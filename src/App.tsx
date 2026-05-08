import { useState } from "react"
import { FileText, Home, Pause, Play, RotateCcw, Sparkles, Upload } from "lucide-react"
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

GlobalWorkerOptions.workerSrc = pdfWorker

async function extractTextFromPdf(buffer: ArrayBuffer) {
  const loadingTask = getDocument({ data: buffer })
  const pdf = await loadingTask.promise
  const pageTexts: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items as Array<{ str?: string }>
    const pageText = items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .filter((text) => text.trim().length > 0)
      .join(" ")

    pageTexts.push(pageText)
  }

  return pageTexts.join("\n\n").trim()
}

export function App() {
  const [page, setPage] = useState<"home" | "reader">("home")
  const [doc, setDoc] = useState("")
  const [docSource, setDocSource] = useState<"paste" | "upload" | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [draftText, setDraftText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wpm, setWpm] = useState(300)
  const [isPlaying, setIsPlaying] = useState(false)

  const sourceLabel = docSource === "paste"
    ? "Pasted text"
    : fileName
      ? `File: ${fileName}`
      : null

  const readerWord = doc
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] ?? "Ready"

  const handleUseText = () => {
    const trimmed = draftText.trim()
    if (!trimmed) {
      setError("Paste some text before saving it.")
      return
    }

    setDoc(trimmed)
    setDocSource("paste")
    setFileName(null)
    setError(null)
  }

  const handleClearDraft = () => {
    setDraftText("")
  }

  const handleWpmInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const value = Number(event.target.value)
    if (!Number.isFinite(value)) {
      return
    }

    const clamped = Math.min(900, Math.max(60, Math.round(value)))
    setWpm(clamped)
  }

  const handleStartReading = () => {
    setIsPlaying(false)
    setPage("reader")
  }

  const handleGoHome = () => {
    setIsPlaying(false)
    setPage("home")
  }

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsParsing(true)
    setError(null)
    setDoc("")
    setDocSource("upload")
    setFileName(file.name)

    const fileNameLower = file.name.toLowerCase()
    const isPdf = file.type === "application/pdf" || fileNameLower.endsWith(".pdf")
    const isTxt = file.type === "text/plain" || fileNameLower.endsWith(".txt")

    try {
      if (isTxt) {
        const text = await file.text()
        if (!text.trim()) {
          setError("This text file is empty.")
        } else {
          setDoc(text)
        }
      } else if (isPdf) {
        const buffer = await file.arrayBuffer()
        const text = await extractTextFromPdf(buffer)
        if (!text.trim()) {
          setError("No selectable text found in this PDF.")
        } else {
          setDoc(text)
        }
      } else {
        setError("Unsupported file type. Upload a .txt or .pdf file.")
      }
    } catch {
      setError("Unable to read this document. Please try another file.")
    } finally {
      setIsParsing(false)
      event.target.value = ""
    }
  }

  if (page === "reader") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 -top-48 h-104 w-104 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 top-40 h-72 w-72 rounded-full bg-secondary/70 blur-3xl" />

          <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <section className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Reader
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl">
                Reader
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Focus on the word between the guides.
              </p>
            </section>

            <Card className="mx-auto w-full max-w-3xl">
              <CardContent className="space-y-6 pt-6">
                <div className="relative">
                  <Separator />
                  <Separator
                    orientation="vertical"
                    className="absolute bottom-0 left-2/5 h-6"
                  />
                </div>
                <div className="text-center font-heading text-3xl sm:text-4xl">
                  {readerWord}
                </div>
                <div className="relative">
                  <Separator />
                  <Separator
                    orientation="vertical"
                    className="absolute left-2/5 top-0 h-6"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <Button className="w-full sm:w-auto" onClick={handleTogglePlay}>
                  {isPlaying ? (
                    <Pause className="mr-2 size-4" />
                  ) : (
                    <Play className="mr-2 size-4" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setIsPlaying(false)}
                >
                  <RotateCcw className="mr-2 size-4" />
                  Restart
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleGoHome}
                >
                  <Home className="mr-2 size-4" />
                  Go home
                </Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 -top-48 h-104 w-104 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 top-40 h-72 w-72 rounded-full bg-secondary/70 blur-3xl" />

        <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <section className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Ready in seconds
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl">
              Speed Reader
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Paste a paragraph or upload a .txt/.pdf. We will extract and keep it
              locally as your document so you can start reading instantly.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Paste text
                </CardTitle>
                <CardDescription>
                  Drop in a paragraph or any block of text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-text">Text input</Label>
                  <Textarea
                    id="paste-text"
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    placeholder="Paste or type the text you want to read..."
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={handleUseText}
                    disabled={isParsing || draftText.trim().length === 0}
                  >
                    Use this text
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleClearDraft}
                    disabled={isParsing || draftText.length === 0}
                  >
                    Clear draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="size-4 text-primary" />
                  Upload file
                </CardTitle>
                <CardDescription>
                  Accepts .txt or .pdf files with selectable text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Choose a file</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,application/pdf"
                    onChange={handleFileChange}
                    disabled={isParsing}
                  />
                </div>
                <div className="rounded-2xl border border-dashed bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Your document stays in this browser. We only extract text
                  locally.
                </div>
                {fileName ? (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="max-w-[65%] truncate">{fileName}</span>
                    <span>{isParsing ? "Reading..." : doc ? "Ready" : ""}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Reading speed</CardTitle>
                <CardDescription>
                  Set your target words per minute before you start.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Words per minute</span>
                  <span className="font-medium text-foreground">{wpm} WPM</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <Slider
                    value={[wpm]}
                    min={60}
                    max={900}
                    step={10}
                    onValueChange={(value) => setWpm(value[0] ?? 60)}
                    disabled={isParsing}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="wpm-input" className="sr-only">
                      WPM
                    </Label>
                    <Input
                      id="wpm-input"
                      type="number"
                      min={60}
                      max={900}
                      value={wpm}
                      onChange={handleWpmInputChange}
                      className="w-24"
                      disabled={isParsing}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Range: 60-900 WPM.</span>
                  <span>
                    {isParsing
                      ? "Reading your document..."
                      : doc
                        ? "Document ready."
                        : "No document loaded yet."}
                  </span>
                </div>
                {sourceLabel ? (
                  <div className="text-xs text-muted-foreground">
                    Source: {sourceLabel}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  {doc
                    ? "Ready to read when you are."
                    : "Load a document to enable reading."}
                </span>
                <Button
                  className="w-full sm:w-auto"
                  disabled={!doc || isParsing}
                  onClick={handleStartReading}
                >
                  Start reading
                </Button>
              </CardFooter>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
