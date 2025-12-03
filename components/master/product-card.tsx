"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ImageIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Product } from "./product-list";

interface Props {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ product, onEdit, onDelete }: Props) {
  const imgSrc = product.photo || "/placeholder.svg";

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 bg-white group">
      <div className="relative h-48 overflow-hidden">
        {product.photo ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge
            className={
              product.isAvailable
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-400 text-white shadow-md"
            }
          >
            {product.isAvailable ? "Tersedia" : "Tidak tersedia"}
          </Badge>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <Badge
            variant="outline"
            className="mb-2 text-primary border-primary/30 bg-primary/5"
          >
            {product.category}
          </Badge>
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description || "Tidak ada deskripsi"}
        </p>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-black text-black hover:bg-black/5 bg-transparent"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  );
}
