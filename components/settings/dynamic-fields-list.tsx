import { Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DynamicFieldsList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New Field
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Order</th>
                <th className="text-left p-4 text-sm font-semibold">Label</th>
                <th className="text-left p-4 text-sm font-semibold">Key</th>
                <th className="text-left p-4 text-sm font-semibold">Type</th>
                <th className="text-center p-4 text-sm font-semibold">Required</th>
                <th className="text-center p-4 text-sm font-semibold">Active</th>
                <th className="text-right p-4 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4">1</td>
                <td className="p-4 font-medium">Company Size</td>
                <td className="p-4 text-muted-foreground">company_size</td>
                <td className="p-4">Text</td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-4">2</td>
                <td className="p-4 font-medium">Industry</td>
                <td className="p-4 text-muted-foreground">industry</td>
                <td className="p-4">Dropdown</td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
