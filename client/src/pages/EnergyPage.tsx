import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Camera, FileText, Loader2, Sun, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useSaveFeedback } from '../lib/useSaveFeedback'
import type { ActionReward, BillOcrResult } from '@carbon/shared'
import { CelebrationBanner } from '../components/rewards'
import { PageHeader, EmptyState } from '../components/ui'

interface EnergyReading {
  id: string
  periodStart: string
  periodEnd: string
  kwh: number
  solarOffsetKwh: number
  lpgKg: number
  co2eKg: number
  source?: string
}

async function ocrImageFile(file: File): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(file)
    return data.text
  } finally {
    await worker.terminate()
  }
}

export function EnergyPage() {
  const [searchParams] = useSearchParams()
  const scanRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [form, setForm] = useState({
    kwh: 150,
    solarOffsetKwh: 0,
    lpgKg: 14.2,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
  })
  const { saved, markSaved } = useSaveFeedback()
  const [lastReward, setLastReward] = useState<ActionReward | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState<BillOcrResult | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const load = () => api<EnergyReading[]>('/energy').then(setReadings).catch(console.error)
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchParams.get('scan') === '1' && scanRef.current) {
      scanRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchParams])

  const applyOcrToForm = (parsed: BillOcrResult) => {
    if (!parsed.kwh) return
    setForm((f) => ({
      ...f,
      kwh: parsed.kwh!,
      periodStart: parsed.periodStart ? parsed.periodStart.slice(0, 10) : f.periodStart,
      periodEnd: parsed.periodEnd ? parsed.periodEnd.slice(0, 10) : f.periodEnd,
    }))
  }

  const parseBillText = async (text: string, save = false) => {
    setOcrLoading(true)
    setOcrError(null)
    try {
      const parsed = await api<BillOcrResult & { reward?: ActionReward; reading?: EnergyReading }>(
        '/energy/ocr',
        {
          method: 'POST',
          body: JSON.stringify({ text, save, lpgKg: form.lpgKg }),
        }
      )
      setOcrResult(parsed)
      if (parsed.kwh) applyOcrToForm(parsed)
      if (save && parsed.reward) {
        setLastReward(parsed.reward)
        load()
      }
    } catch (e) {
      setOcrError(e instanceof Error ? e.message : 'Could not read bill')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    try {
      const text = await ocrImageFile(file)
      await parseBillText(text, false)
    } catch {
      setOcrError('Photo scan failed — try a clearer image or use sample bill')
    }
  }

  const trySampleBill = async () => {
    const { text } = await api<{ text: string }>('/energy/ocr/sample')
    await parseBillText(text, false)
  }

  const saveFromOcr = async () => {
    if (!ocrResult?.kwh) return
    const text =
      ocrResult.rawText ??
      `Units Consumed: ${ocrResult.kwh} kWh\nPeriod: ${form.periodStart} to ${form.periodEnd}`
    await parseBillText(text, true)
    markSaved()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await api<{ reward?: ActionReward }>('/energy', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        periodStart: new Date(form.periodStart).toISOString(),
        periodEnd: new Date(form.periodEnd).toISOString(),
      }),
    })
    if (res.reward) setLastReward(res.reward)
    markSaved()
    load()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Zap}
        iconBg="bg-amber-100"
        iconColor="text-amber-700"
        title="Electricity & cooking gas"
        subtitle="Scan your bill or enter kWh manually"
        help="Find 'Units Consumed' or kWh on your electricity bill. One LPG cylinder is about 14.2 kg if you use gas for cooking."
      />

      <div ref={scanRef} className="card space-y-4 border-2 border-amber-200 bg-amber-50/50">
        <div>
          <p className="text-sm font-bold text-amber-900">📸 Scan electricity bill</p>
          <p className="mt-1 text-xs text-amber-800">
            Photo your bill — we read kWh and billing dates (BSES, Tata Power, MSEB, etc.)
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="bill-photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={ocrLoading}
            aria-label="Take photo or upload electricity bill"
            onClick={() => fileInputRef.current?.click()}
          >
            {ocrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            {ocrLoading ? 'Reading bill…' : 'Take photo / upload'}
          </button>
          <button
            type="button"
            className="btn-secondary flex items-center justify-center gap-2"
            disabled={ocrLoading}
            onClick={trySampleBill}
          >
            <FileText className="h-4 w-4" aria-hidden />
            Try sample bill
          </button>
        </div>

        {ocrError && (
          <p className="text-sm text-red-600" role="alert">
            {ocrError}
          </p>
        )}

        {ocrResult && (
          <div className="rounded-xl bg-white p-3 text-sm">
            <p className="font-semibold text-slate-900">{ocrResult.message}</p>
            {ocrResult.kwh != null && (
              <p className="mt-1 text-slate-600">
                {ocrResult.kwh} kWh · {Math.round(ocrResult.confidence * 100)}% confidence
              </p>
            )}
            {ocrResult.kwh != null && (
              <button type="button" className="btn-primary mt-3 w-full" onClick={saveFromOcr}>
                {saved ? 'Saved from scan!' : 'Save scanned bill'}
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <p className="text-sm font-semibold text-slate-700">Or enter manually</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="start">Bill from date</label>
            <input
              id="start"
              className="input"
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="end">Bill to date</label>
            <input
              id="end"
              className="input"
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="kwh">Electricity used (kWh / units)</label>
          <input
            id="kwh"
            className="input"
            type="number"
            min={0}
            value={form.kwh}
            onChange={(e) => setForm({ ...form, kwh: +e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="solar">
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" aria-hidden /> Solar power used at home (optional)
            </span>
          </label>
          <input
            id="solar"
            className="input"
            type="number"
            min={0}
            value={form.solarOffsetKwh}
            onChange={(e) => setForm({ ...form, solarOffsetKwh: +e.target.value })}
          />
          <p className="hint">If you have solar panels, enter kWh they produced</p>
        </div>

        <div>
          <label className="label" htmlFor="lpg">LPG gas cylinder (kg)</label>
          <input
            id="lpg"
            className="input"
            type="number"
            step="0.1"
            min={0}
            value={form.lpgKg}
            onChange={(e) => setForm({ ...form, lpgKg: +e.target.value })}
          />
          <p className="hint">Set to 0 if you do not use LPG at home</p>
        </div>

        <button type="submit" className="btn-primary w-full">
          {saved ? 'Saved!' : 'Save bill details'}
        </button>
        {lastReward && <CelebrationBanner reward={lastReward} />}
      </form>

      <h2 className="section-title">Previous bills</h2>
      {readings.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No bills added yet"
          message="Scan your latest electricity bill or enter units (kWh) once a month."
        />
      ) : (
        <div className="space-y-3">
          {readings.map((r) => (
            <div key={r.id} className="card flex items-center gap-4">
              <div className="icon-circle bg-amber-50">
                <Zap className="h-6 w-6 text-amber-600" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900">
                  {r.kwh} kWh
                  {r.source === 'OCR' && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      scanned
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <p className="text-right text-sm font-bold text-brand">
                {r.co2eKg.toFixed(1)} kg<br />
                <span className="font-normal text-slate-500">CO₂</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
