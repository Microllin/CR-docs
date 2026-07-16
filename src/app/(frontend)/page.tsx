import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from './_lib/nav'

export default function HomePage() {
  redirect(`/docs/${DEFAULT_LOCALE}`)
}
