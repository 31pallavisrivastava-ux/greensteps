import { useState } from 'react'
import { MERCHANTS, DeliveryMerchant } from '@carbon/shared'
import type { PackagingCatalogItemDto } from '@carbon/shared'
import { Package, Plus, ShoppingBag } from 'lucide-react'
import { api } from '../lib/api'
import { usePageLoad } from '../lib/usePageLoad'
import { useSaveFeedback } from '../lib/useSaveFeedback'
import { PageHeader, EmptyState } from '../components/ui'

interface LineItem { catalogId?: string; label: string; quantity: number }

interface Order {
  id: string
  merchant: string
  orderedAt: string
  plasticGrams: number
  deliveryCo2eKg: number
  lineItems: Array<{ label: string; quantity: number }>
}

const MERCHANT_ICONS: Record<string, string> = {
  BLINKIT: 'bg-yellow-100 text-yellow-800',
  ZEPTO: 'bg-purple-100 text-purple-800',
  SWIGGY_INSTAMART: 'bg-orange-100 text-orange-800',
  SWIGGY_FOOD: 'bg-orange-100 text-orange-900',
  ZOMATO: 'bg-red-100 text-red-800',
}

export function PurchasesPage() {
  const [merchant, setMerchant] = useState<DeliveryMerchant>(DeliveryMerchant.BLINKIT)
  const [cart, setCart] = useState<LineItem[]>([])
  const { saved, markSaved } = useSaveFeedback()
  const { data: orders, reload: loadOrders } = usePageLoad(() => api<Order[]>('/purchases'))

  const merchantInfo = MERCHANTS.find((m) => m.merchant === merchant)!
  const orderType = merchantInfo.orderType
  const { data: catalog } = usePageLoad(
    () => api<PackagingCatalogItemDto[]>(`/packaging/catalog?orderType=${orderType}`),
    [orderType]
  )

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
    markSaved()
    loadOrders()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShoppingBag}
        iconBg="bg-orange-100"
        iconColor="text-orange-700"
        title="Food & grocery deliveries"
        subtitle="Blinkit, Zepto, Swiggy, Zomato orders"
        help="Step 1: Pick the app you ordered from. Step 2: Tap items you received. Step 3: Press Save. We estimate plastic and delivery pollution."
      />

      <div className="card">
        <p className="label">Which app did you order from?</p>
        <div className="flex flex-wrap gap-2">
          {MERCHANTS.map((m) => (
            <button
              key={m.merchant}
              type="button"
              onClick={() => { setMerchant(m.merchant); setCart([]) }}
              className={`chip ${merchant === m.merchant ? 'chip-active' : 'chip-inactive'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="label mt-5">
          {orderType === 'QUICK_COMMERCE' ? 'Tap groceries you ordered' : 'Tap food items you ordered'}
        </p>
        <div className="flex flex-wrap gap-2">
          {(catalog ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item)}
              className="chip chip-inactive"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="mt-5 rounded-2xl bg-brand-muted p-4">
            <p className="font-bold text-brand">Your order ({cart.length} item types)</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {cart.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>{c.label} × {c.quantity}</span>
                  <button
                    type="button"
                    className="font-bold text-red-600"
                    onClick={() => setCart(cart.filter((_, j) => j !== i))}
                    aria-label={`Remove ${c.label}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-primary mt-4 w-full" onClick={submit}>
              {saved ? 'Order saved!' : 'Save this order'}
            </button>
          </div>
        )}
      </div>

      <h2 className="section-title">Past orders</h2>
      {(!orders || orders.length === 0) ? (
        <EmptyState
          icon={Package}
          title="No deliveries logged yet"
          message="After your next Blinkit or Swiggy order, come here and tap what you bought."
        />
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="card flex gap-4">
              <div className={`icon-circle ${MERCHANT_ICONS[o.merchant]?.split(' ')[0] ?? 'bg-slate-100'}`}>
                <ShoppingBag className={`h-6 w-6 ${MERCHANT_ICONS[o.merchant]?.split(' ')[1] ?? 'text-slate-600'}`} aria-hidden />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{o.merchant.replace(/_/g, ' ')}</p>
                <p className="text-sm text-slate-500">
                  {new Date(o.orderedAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {o.lineItems.map((l) => `${l.label}×${l.quantity}`).join(', ')}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-cyan-700">{o.plasticGrams.toFixed(0)}g plastic</p>
                <p className="text-slate-500">{o.deliveryCo2eKg.toFixed(2)} kg CO₂</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
