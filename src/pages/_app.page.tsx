import { Auth } from '#components/Auth'
import { defaultLocale } from '#i18n/locale'
import { I18nProvider } from 'next-localization'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { lngDict, ...rest } = pageProps
  const locale = router.query.locale as unknown as string | string[] | undefined

  if (Array.isArray(locale)) {
    throw new Error('The query "locale" cannot be an array!')
  }

  return (
    <I18nProvider lngDict={lngDict} locale={locale || defaultLocale}>
      <Auth>
        <Component {...rest} />
      </Auth>
    </I18nProvider>
  )
}
