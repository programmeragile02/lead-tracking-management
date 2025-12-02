import { MessageCircle } from "lucide-react"

export function LeadWhatsAppTab() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">WhatsApp Account</p>
            <p className="text-sm text-green-700">Connected: +62 821 9876 5432</p>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">All</button>
        <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium">Incoming</button>
        <button className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium">Outgoing</button>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <ChatBubble message="Halo, saya tertarik dengan Premium Package" time="09:15" isCustomer />
        <ChatBubble
          message="Halo Pak Budi! Terima kasih sudah menghubungi kami. Saya akan jelaskan detail Premium Package"
          time="09:18"
          isCustomer={false}
        />
        <ChatBubble message="Berapa harganya?" time="09:20" isCustomer />
      </div>
    </div>
  )
}

function ChatBubble({
  message,
  time,
  isCustomer,
}: {
  message: string
  time: string
  isCustomer: boolean
}) {
  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] ${isCustomer ? "order-1" : "order-2"}`}>
        <div className={`rounded-2xl px-4 py-3 ${isCustomer ? "bg-muted" : "gradient-primary text-white"}`}>
          <p className="text-sm">{message}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-2">{time}</p>
      </div>
    </div>
  )
}
