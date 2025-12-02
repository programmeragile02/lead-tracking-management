import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProfileHeader() {
  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-violet-600 shadow-lg">
            AS
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors">
            <Camera className="w-4 h-4 text-violet-600" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">Andi Saputra</h2>
          <p className="text-purple-100 font-medium mb-2">Sales Representative</p>
          <p className="text-purple-200 text-sm">andi@company.com</p>
        </div>

        <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-md">
          Edit Profil
        </Button>
      </div>
    </div>
  )
}
