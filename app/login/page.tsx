import Link from "next/link"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-purple-blue">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Sistem Tracking Lead</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Masuk untuk mengelola lead Anda</p>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email atau Username</Label>
              <Input id="email" type="text" placeholder="Masukkan email Anda" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" type="password" placeholder="Masukkan kata sandi" className="h-11" />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-hover">
                Lupa kata sandi?
              </Link>
            </div>

            <Link href="/dashboard/sales" className="block">
              <Button className="w-full h-11 gradient-primary text-white hover:opacity-90">
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </Link>
          </form>
        </div>

        <p className="text-center text-white text-sm mt-4">© 2025 Sistem Tracking Lead. Hak cipta dilindungi.</p>
      </div>
    </div>
  )
}
