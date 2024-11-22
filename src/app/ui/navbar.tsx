'use client'
import { HomeIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        <ul className="flex items-center gap-4">
          <Link href="/"><HomeIcon /></Link>
          /
          {/* <Link href="/register">Регистрация</Link> */}
          <Link href="/create">Создание аттестата</Link>
        </ul>
        <w3m-button label="Подключите кошелек" loadingLabel="Подключение..." balance="hide" />
      </nav>
    </header>
  )
}
