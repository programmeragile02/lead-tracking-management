import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function LeadOverviewTab() {
  return (
    <div className="space-y-6">
      {/* Lead Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Lead Info</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="gradient-primary text-white text-xl">BP</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Budi Permana</p>
              <p className="text-sm text-muted-foreground">+62 812 3456 7890</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium">Jl. Sudirman No. 123</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">City</p>
              <p className="font-medium">Jakarta</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Channel</p>
              <p className="font-medium">Instagram Ads</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Product</p>
              <p className="font-medium">Premium Package</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Deal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Status & Deal</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current Status</p>
            <select className="w-full h-10 px-3 rounded-lg border bg-white">
              <option>Hot</option>
              <option>Warm</option>
              <option>Cold</option>
              <option>Closed Won</option>
              <option>Closed Lost</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Potential Value</p>
              <p className="text-xl font-bold">Rp 15,000,000</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Actual Value</p>
              <p className="text-xl font-bold">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Owner</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sales</span>
            <span className="font-medium">Andi Wijaya</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Team Leader</span>
            <span className="font-medium">Siti Rahma</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Manager</span>
            <span className="font-medium">Budi Santoso</span>
          </div>
        </div>
      </div>
    </div>
  )
}
