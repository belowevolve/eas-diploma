'use client'
import { routes } from '@/shared/config/ROUTES'
import { HomeIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-(--breakpoint-xl) items-center justify-between px-4">
        <ul className="flex items-center gap-4">
          <Link href={routes.register}><HomeIcon /></Link>
          /
          {/* <Link href="/register">Регистрация</Link> */}
          <Link href={routes.createMultiple}>Цифровые аттестаты</Link>
        </ul>
        <w3m-button label="Подключите кошелек" loadingLabel="Подключение..." balance="hide" />
      </nav>
    </header>
  )
}
