"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
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

export function ProductTable({ products }: { products: Product[] }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-subtle hover:bg-gradient-subtle">
            <TableHead className="font-semibold text-gray-900">Nama Produk</TableHead>
            <TableHead className="font-semibold text-gray-900">Kategori</TableHead>
            <TableHead className="font-semibold text-gray-900">Harga</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-semibold gradient-text">{formatPrice(product.price)}</span>
              </TableCell>
              <TableCell>
                <Badge className="bg-green-500 text-white">{product.stock}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
