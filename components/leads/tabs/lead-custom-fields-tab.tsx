import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LeadCustomFieldsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-6">Custom Fields</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Input placeholder="Enter company size" />
          </div>

          <div className="space-y-2">
            <Label>Industry</Label>
            <select className="w-full h-10 px-3 rounded-lg border bg-white">
              <option>Select industry</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Retail</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Preferred Contact Method</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Phone</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-20 lg:bottom-6">
        <Button className="w-full h-12 gradient-primary text-white">Save Changes</Button>
      </div>
    </div>
  )
}
