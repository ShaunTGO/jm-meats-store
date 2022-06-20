import { z } from 'zod'
import catalogsJson from './json/catalogs.json'
import taxonomiesJson from './json/taxonomies.json'
import taxonsJson from './json/taxons.json'

const catalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  taxonomies: z.string().array()
})

const taxonomySchema = z.object({
  id: z.string(),
  name: z.string(),
  facetKey: z.string(),
  taxons: z.string().array()
})

const taxonSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: localizedFieldSchema(z.string()),
  description: localizedFieldSchema(z.string()),
  slug: z.string(),
  image: z.string().optional(),
  references: z.string().array(),
  taxons: z.string().array().optional()
})

export type RawDataCatalog = z.infer<typeof catalogSchema>
export type RawDataTaxonomy = z.infer<typeof taxonomySchema>
export type RawDataTaxon = z.infer<typeof taxonSchema>

const rawDataCatalogs: RawDataCatalog[] = catalogSchema.array().parse(catalogsJson)
const rawDataTaxonomies: RawDataTaxonomy[] = taxonomySchema.array().parse(taxonomiesJson)
const rawDataTaxons: RawDataTaxon[] = taxonSchema.array().parse(taxonsJson)





// -------------------------------

type ProductDataset = {
  [code: LocalizedProductWithVariant['sku']]: LocalizedProductWithVariant
}

// export function createProductDatasetFromCatalog(catalog: RawDataCatalog, locale: string): ProductDataset {

// }



// -------------------------------




import type { RawDataProduct } from '#data/products'
import { Locale, localizedFieldSchema, translateField } from '#i18n/locale'
import { deepFind, DeepFindResult } from '#utils/collection'
import type { LocalizedProductWithVariant } from '#utils/products'
import { flattenProductVariants, getProductWithVariants } from '#utils/products'
import type { Unserializable } from '#utils/unserializable'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'

export type Catalog = Unserializable<Omit<RawDataCatalog, 'taxonomies'> & {
  taxonomies: Taxonomy[]
}>

export type Taxonomy = Omit<RawDataTaxonomy, 'taxons'> & {
  _unserializable: Symbol
  taxons: Taxon[]
}

export type Taxon = Omit<RawDataTaxon, 'label' | 'description' | 'references' | 'taxons'> & {
  _unserializable: Symbol
  label: string
  description: string
  products: LocalizedProductWithVariant[]
  taxons: Taxon[]
}

export const getCatalog = (locale: Locale, rawDataProduct: RawDataProduct[] = []): Catalog => {
  const name = locale.isShoppable ? locale.country.catalog : locale.language.catalog
  const rawDataCatalog = rawDataCatalogs.find(catalog => catalog.name === name)

  if (!rawDataCatalog) {
    throw new Error(`Cannot find the catalog with name "${name}"`)
  }

  const productDataset = buildProductDataset(rawDataCatalog, locale.code, rawDataProduct)

  return resolveCatalog(rawDataCatalog, locale.code, productDataset)
}

function flattenReferences(taxon: RawDataTaxon): string[] {
  return taxon.references.concat(
    (taxon.taxons || []).map(getTaxon).flatMap(flattenReferences)
  )
}

function buildProductDataset(catalog: RawDataCatalog, locale: string, rawDataProducts: RawDataProduct[] = []): ProductDataset {
  if (rawDataProducts.length <= 0) {
    return {}
  }

  const productDataset: ProductDataset = {}

  catalog.taxonomies.forEach(taxonomyKey => {
    const taxonomy = getTaxonomy(taxonomyKey)

    taxonomy.taxons.forEach(taxonKey => buildProductDataset_taxon(taxonKey, [], taxonomy, locale, rawDataProducts))
  })

  function buildProductDataset_taxon(taxonKey: string, prevTaxons: RawDataTaxon[], taxonomy: RawDataTaxonomy, locale: string, rawDataProducts: RawDataProduct[]): void {
    const taxon = getTaxon(taxonKey)

    const products = flattenReferences(taxon).map(ref => getProductWithVariants(ref, locale, rawDataProducts))

    flattenProductVariants(products).forEach(product => {
      productDataset[product.sku] = productDataset[product.sku] || product
      productDataset[product.sku] = {
        ...productDataset[product.sku],
        [taxonomy.facetKey]: uniq([
          // @ts-expect-error
          ...(productDataset[product.sku][taxonomy.facetKey] || []),
          `${prevTaxons.length > 0 ? prevTaxons.map(t => `${translateField(t.label, locale)} > `).join('') : ''}${translateField(taxon.label, locale)}`
        ])
      }
    })

    taxon.taxons?.forEach(taxonKey => buildProductDataset_taxon(taxonKey, prevTaxons.concat(taxon), taxonomy, locale, rawDataProducts))
  }

  return productDataset
}

const getTaxonomy = (taxonomyKey: string): RawDataTaxonomy => {
  const taxonomy = rawDataTaxonomies.find(taxonomy => taxonomy.id === taxonomyKey)

  if (!taxonomy) {
    throw new Error(`Cannot find taxonomy with key ${taxonomyKey}`)
  }

  return taxonomy
}

const getTaxon = (taxonKey: string): RawDataTaxon => {
  const taxon = rawDataTaxons.find(taxon => taxon.id === taxonKey)

  if (!taxon) {
    throw new Error(`Cannot find taxon with key ${taxonKey}`)
  }

  return taxon
}

const resolveCatalog = (catalog: RawDataCatalog, locale: string, productDataset: ProductDataset): Catalog => {
  return {
    _unserializable: Symbol.for('unserializable'),
    id: catalog.id,
    name: catalog.name,
    taxonomies: catalog.taxonomies
      .map(getTaxonomy)
      .map(taxonomy => resolveTaxonomy(taxonomy, locale, Object.values(productDataset)))
  }
}

const resolveTaxonomy = (taxonomy: RawDataTaxonomy, locale: string, productList: LocalizedProductWithVariant[]): Taxonomy => {
  return {
    _unserializable: Symbol.for('unserializable'),
    id: taxonomy.id,
    facetKey: taxonomy.facetKey,
    name: taxonomy.name,
    taxons: taxonomy.taxons
      .map(getTaxon)
      .map(taxon => resolveTaxon(taxon, locale, productList))
  }
}

const resolveTaxon = (taxon: RawDataTaxon, locale: string, productList: LocalizedProductWithVariant[]): Taxon => {
  return {
    _unserializable: Symbol.for('unserializable'),
    id: taxon.id,
    label: translateField(taxon.label, locale),
    description: translateField(taxon.description, locale),
    name: taxon.name,
    slug: taxon.slug,
    ...(taxon.image ? { image: taxon.image } : {}),
    taxons: taxon.taxons?.map(getTaxon)
      .map(t => resolveTaxon(t, locale, productList)) || [],
    products: productList.length > 0 ? taxon.references.map(referenceCode => {
      return getProductWithVariants(referenceCode, locale, productList)
    }) : []
  }
}

export function flattenProductsFromTaxon(taxon: Taxon): LocalizedProductWithVariant[] {
  return uniqBy(
    taxon.products.concat(taxon.taxons?.flatMap(flattenProductsFromTaxon) || []),
    'sku'
  )
}

export function flattenProductsFromCatalog(catalog: Catalog): LocalizedProductWithVariant[] {
  return uniqBy(
    catalog.taxonomies.flatMap(({ taxons }) => taxons.flatMap(flattenProductsFromTaxon)),
    'sku'
  )
}

export function findTaxonBySlug(catalog: Catalog, slug: string): DeepFindResult<Taxon> {
  const taxon = catalog.taxonomies.reduce((acc, cv) => {
    if (acc) {
      return acc
    }

    return deepFind(cv.taxons, 'taxons', 'slug', slug)
  }, undefined as DeepFindResult<Taxon> | undefined)

  if (!taxon) {
    throw new Error('Cannot find Taxon!')
  }

  return taxon
}

// function getCatalogSlugs() {

// }

// function getProductsBySlug(slug: string) {

// }
