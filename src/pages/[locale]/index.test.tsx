import type { Catalog, Taxon, Taxonomy } from '#data/catalogs'
import { getRootNavigationLinks } from '#utils/catalog'
import { makeUnserializable } from '#utils/unserializable'
import { render } from '@testing-library/react'
import { I18nProvider } from 'next-localization'
import HomePage from './index.page'


jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {
        locale: 'en-US'
      },
      asPath: '',
    };
  },
}));

test('home', () => {
  const taxon: Taxon = {
    id: 'taxon_1',
    label: 'Accessories',
    description: 'Accessories',
    slug: 'accessories',
    name: 'All Accessories',
    image: '/assets/images/samsung-case-samsung-galaxy-s21-plus-lifestyle-4-60f836d4aaa9d.png',
    products: [],
    taxons: []
  }

  const taxonomy: Taxonomy = {
    id: 'taxonomy_1',
    facetKey: 'categories',
    name: 'Default Category',
    taxons: [taxon]
  }

  const catalog: Catalog = makeUnserializable({
    id: 'catalog_1',
    name: 'AMER',
    taxonomies: [taxonomy]
  })

  const { container } = render(
    <I18nProvider lngDict={{ general: { viewAll: 'View all' } }} locale='en'>
      <HomePage navigation={getRootNavigationLinks(catalog)} homepage={[]} />
    </I18nProvider>
  )

  // const main = within(screen.getByRole('main'))

  // expect(
  //   main.getByRole('heading', { level: 3, name: /Accessories/i })
  // ).toBeDefined()

  expect(container).toMatchSnapshot()
})
