"use client"

import { useState } from "react"
import { ProductCard } from "./product-card"
import { ProductTable } from "./product-table"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

const dummyProducts = [
  {
    id: "1",
    name: "Paket Software ERP Premium",
    category: "Software",
    price: 25000000,
    description: "Sistem ERP lengkap untuk perusahaan menengah hingga besar",
    stock: "Tersedia",
    image: "/erp-software-concept.png",
  },
  {
    id: "2",
    name: "Konsultasi Digital Marketing",
    category: "Jasa",
    price: 15000000,
    description: "Paket konsultasi digital marketing 6 bulan dengan tim ahli",
    stock: "Tersedia",
    image: "/digital-marketing-strategy.png",
  },
  {
    id: "3",
    name: "Paket Website Development",
    category: "Web Development",
    price: 30000000,
    description: "Pembuatan website company profile profesional dengan CMS",
    stock: "Tersedia",
    image: "/website-development.png",
  },
  {
    id: "4",
    name: "Cloud Hosting Enterprise",
    category: "Hosting",
    price: 12000000,
    description: "Paket cloud hosting dengan SLA 99.9% uptime per tahun",
    stock: "Tersedia",
    image: "/cloud-hosting.jpg",
  },
  {
    id: "5",
    name: "Mobile App Development",
    category: "App Development",
    price: 50000000,
    description: "Pembuatan aplikasi mobile iOS & Android native",
    stock: "Tersedia",
    image: "/mobile-app-showcase.png",
  },
  {
    id: "6",
    name: "SEO Optimization Package",
    category: "Jasa",
    price: 8000000,
    description: "Optimasi SEO untuk meningkatkan ranking website di Google",
    stock: "Tersedia",
    image: "/seo-optimization-concept.png",
  },
]

export function ProductList() {
  const isMobile = !useMediaQuery("(min-width: 768px)")
  const [viewMode, setViewMode] = useState<"card" | "table">(isMobile ? "card" : "table")

  return (
    <div className="space-y-4">
      {/* View Toggle - Hidden on Mobile */}
      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            className={viewMode === "card" ? "gradient-primary text-white" : ""}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kartu
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "gradient-primary text-white" : ""}
          >
            <List className="h-4 w-4 mr-2" />
            Tabel
          </Button>
        </div>
      )}

      {/* Product Display */}
      {viewMode === "card" || isMobile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <ProductTable products={dummyProducts} />
      )}
    </div>
  )
}
