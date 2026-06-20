import { useEffect, useState } from 'react'
import { MERCHANTS, DeliveryMerchant } from '@carbon/shared'
import type { PackagingCatalogItemDto } from '@carbon/shared'
import { api } from '../lib/api'

interface LineItem { catalogId?: string; label: string; quantity: number }

export function PurchasesPage() {
  const [merchant, setMerchant] = useState<DeliveryMerchant>(DeliveryMerchant.BLINKIT)
  const [catalog, setCatalog] = useState<PackagingCatalogItemDto[]>([])
  const [cart, setCart] = useState<LineItem[]>([])
  const [orders, setOrders] = useState<Array<{
    id: string
    merchant: string
    orderedAt: string
    plasticGrams: number
    deliveryCo2eKg: number
    lineItems: Array<{ label: string; quantity: number }>
  }>>([])

  const merchantInfo = MERCHANTS.find((m) => m.merchant === merchant)!
  const orderType = merchantInfo.orderType

  useEffect(() => {
    api<PackagingCatalogItemDto[]>(`/packaging/catalog?orderType=${orderType}`)
      .then(setCatalog)
      .catch(console.error)
  }, [orderType])

  const loadOrders = () => api<typeof orders>('/purchases').then(setOrders).catch(console.error)
  useEffect(() => { loadOrders() }, [])

  const addItem = (item: PackagingCatalogItemDto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.catalogId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.catalogId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { catalogId: item.id, label: item.label, quantity: 1 }]
    })
  }

  const submit = async () => {
    if (!cart.length) return
    await api('/purchases/orders', {
      method: 'POST',
      body: JSON.stringify({
        merchant,
        orderedAt: new Date().toISOString(),
        lineItems: cart,
      }),
    })
    setCart([])
    loadOrders()
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold text-brand">Log delivery order</h2>
        <p className="text-xs text-slate-500">Scope 3 · packaging + last-mile CO₂e</p>

        <label className="label mt-3">Merchant</label>
        <div className="flex flex-wrap gap-2">
          {MERCHANTS.map((m) => (
            <button
              key={m.merchant}
              type="button"
              onClick={() => { setMerchant(m.merchant); setCart([]) }}
              className={`rounded-full px-3 py-1 text-xs ${
                merchant === m.merchant ? 'bg-brand text-white' : 'bg-slate-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {orderType === 'QUICK_COMMERCE' ? 'Grocery categories' : 'Food categories'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:border-brand"
            >
              + {item.label}
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="mt-3 rounded-lg bg-slate-50 p-2 text-sm">
            {cart.map((c, i) => (
              <div key={i} className="flex justify-between">
                <span>{c.label} ×{c.quantity}</span>
                <button
                  type="button"
                  className="text-red-500 text-xs"
                  onClick={() => setCart(cart.filter((_, j) => j !== i))}
                >
                  remove
                </button>
              </div>
            ))}
            <button className="btn-primary mt-2 w-full" onClick={submit}>
              Save order
            </button>
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold">Order history</h2>
      {orders.map((o) => (
        <div key={o.id} className="card text-sm">
          <div className="flex justify-between font-medium">
            <span>{o.merchant.replace(/_/g, ' ')}</span>
            <span>{o.plasticGrams.toFixed(0)}g plastic</span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(o.orderedAt).toLocaleString()} · {o.deliveryCo2eKg.toFixed(2)} kg CO₂e delivery
          </p>
          <p className="mt-1 text-xs">{o.lineItems.map((l) => `${l.label}×${l.quantity}`).join(', ')}</p>
        </div>
      ))}
    </div>
  )
}
