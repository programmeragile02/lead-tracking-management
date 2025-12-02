import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TargetSettingsForm() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Default Targets</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Lead Target (per sales)</Label>
              <Input type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Revenue Target (per sales)</Label>
              <Input type="number" defaultValue="50000000" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-4">Individual Targets</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Sales Name</Label>
                <Input value="Andi Wijaya" disabled />
              </div>
              <div className="space-y-2">
                <Label>Daily Lead</Label>
                <Input type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label>Monthly Revenue</Label>
                <Input type="number" defaultValue="50000000" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button className="gradient-primary text-white">Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
