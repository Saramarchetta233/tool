'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Home, BarChart3, Target, Calculator, Trophy, User, CreditCard, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/userStore'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Matches', href: '/matches', icon: BarChart3 },
  { name: 'TipsterAI', href: '/tipsterai', icon: Target },
  { name: 'Metodo', href: '/metodo', icon: Calculator },
  { name: 'FantaCoach', href: '#', icon: Trophy, disabled: true, badge: 'In arrivo' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, credits, isAuthenticated, logout, fetchUser, refreshCredits } = useUserStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (isAuthenticated) {
      refreshCredits()
    }
  }, [isAuthenticated, refreshCredits])

  const isActive = (href: string) => {
    if (href === '#') return false
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/accedi')
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="text-white font-bold text-lg">CalcioAI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="group flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-500 cursor-not-allowed relative"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Menu Desktop */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-3">
              {/* Credits Display */}
              <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400 mr-2" />
                <span className="text-emerald-400 font-semibold">{credits}</span>
                <span className="text-slate-400 text-sm ml-1">crediti</span>
              </div>

              {/* Recharge Button */}
              <Link href="/ricarica">
                <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                  <Plus className="w-4 h-4 mr-1" />
                  Ricarica
                </Button>
              </Link>

              {/* Profile */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile" className="text-slate-300 hover:text-white">
                  <User className="w-4 h-4 mr-2" />
                  {user?.fullName || user?.email?.split('@')[0] || 'Profilo'}
                </Link>
              </Button>

              {/* Logout */}
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Credits on mobile */}
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1">
              <CreditCard className="w-3 h-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-semibold text-sm">{credits}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-900/98 border-t border-slate-700/50">
            {navigation.map((item) => {
              const Icon = item.icon

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="group flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-500 cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}

            <div className="border-t border-slate-700/50 pt-4 pb-3 space-y-2">
              {/* Recharge on mobile */}
              <Link
                href="/ricarica"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-md"
              >
                <Plus className="w-5 h-5 mr-3" />
                Ricarica Crediti
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
              >
                <User className="w-5 h-5 mr-3" />
                Profilo
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
