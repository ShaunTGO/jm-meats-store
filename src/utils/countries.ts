import type { RawDataCountry } from '#data/countries'

export type NonShoppableCountry = Omit<RawDataCountry, 'market'>

export type ShoppableCountry = NonShoppableCountry & {
  market: Required<RawDataCountry['market']>
}

export type CountriesByRegion = {
  [region: RawDataCountry['region']]: RawDataCountry[]
}

export function countryIsShoppable(country: RawDataCountry): country is ShoppableCountry {
  return typeof country.market === 'number'
}

export const groupByRegion = (countries: RawDataCountry[]): CountriesByRegion => {
  return countries.reduce((countriesByRegion, country) => {
    return {
      ...countriesByRegion,
      [country.region]: [
        ...(countriesByRegion[country.region] || []),
        country
      ]
    }
  }, {} as CountriesByRegion)
}
