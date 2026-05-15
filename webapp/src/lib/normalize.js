// Tên đội: openfootball alias → canonical app names
const ALIAS = {
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey', 'Turkiye': 'Turkey',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Curacao': 'Curaçao',
  'Congo DR': 'DR Congo', 'Democratic Republic of the Congo': 'DR Congo', 'Zaire': 'DR Congo',
  'Czechia': 'Czech Republic', 'Czechoslovakia': 'Czech Republic',
  'West Germany': 'Germany', 'East Germany': 'Germany',
  'USA': 'United States',
  'Soviet Union': 'Russia',
  'Yugoslavia': 'Serbia', 'FR Yugoslavia': 'Serbia', 'Serbia and Montenegro': 'Serbia',
};

export function norm(n) { return ALIAS[n] || n; }

// Modern team → list of aliases for historical lookups
export function getAliases(modernName, modernToHistorical) {
  return modernToHistorical[modernName] || [modernName];
}
