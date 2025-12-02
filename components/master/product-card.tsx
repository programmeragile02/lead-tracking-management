"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  stock: string
  image: string
}

export function ProductCard({ product }: { product: Product }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 bg-white group">
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-green-500 text-white shadow-md">{product.stock}</Badge>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <Badge variant="outline" className="mb-2 text-primary border-primary/30 bg-primary/5">
            {product.category}
          </Badge>
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-2xl font-bold gradient-text">{formatPrice(product.price)}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-primary text-primary hover:bg-primary/5 bg-transparent"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  )
}
