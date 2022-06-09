import { Globe } from '#assets/icons'
import { Container } from '#components/Container'
import { rawDataLanguages } from '#data/languages'
import { Link } from '#i18n/Link'
import { changeLanguage, getLocale, parseLocaleCode } from '#i18n/locale'
import { useI18n } from 'next-localization'
import { useRouter } from 'next/router'
import { InputSelect } from './InputSelect'

export const Footer: React.FC = () => {
  const i18n = useI18n()
  const router = useRouter()
  const locale = getLocale(router.query.locale)

  return (
    <div className='py-8 lg:p-16 mt-24 bg-gray-50'>
      <Container>

        <div className='lg:flex items-center justify-between flex-wrap'>
          <div>
            <div className='flex items-center justify-between'>
              <span className='flex items-center'>
                <Globe className='mr-1.5' /> {locale.country ? locale.country.name : i18n.t('general.international')}
              </span>
              <Link locale=''>
                <a className='uppercase text-violet-400 text-xs border-b border-gray-200 ml-3 mt-1'>{i18n.t('general.chooseCountry')}</a>
              </Link>
            </div>

          </div>

          <div className='mt-6 lg:mt-0'>
            <InputSelect
              onChange={(event) => {
                const languageCode = event.currentTarget.value
                router.push({
                  query: {
                    ...router.query,
                    locale: changeLanguage(router.query.locale, languageCode)
                  }
                }, undefined, { scroll: false })
              }}
              defaultValue={parseLocaleCode(router.query.locale).languageCode}
              options={rawDataLanguages.map(language => ({ value: language.code, label: language.name }))} />
          </div>
        </div>

      </Container>
    </div>
  )
}
