import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductList } from "@/components/master/product-list"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ProductMasterPage() {
  return (
    <DashboardLayout title="Master Produk" role="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar Produk</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola semua produk yang tersedia untuk lead</p>
          </div>
          <Button className="gradient-primary text-white shadow-lg hover:shadow-xl w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Cari nama produk atau kategori..."
            className="pl-10 h-12 border-gray-300 focus:border-primary"
          />
        </div>

        {/* Product List */}
        <ProductList />
      </div>
    </DashboardLayout>
  )
}
