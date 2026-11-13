export type TagColorName =
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'

// Notion light-mode palette: `chip` is the tag pill, `tint` the softer session background.
const PALETTE: Record<TagColorName, { chip: string; tint: string; border: string }> = {
  gray: { chip: '#E3E2E0', tint: '#F1F1EF', border: '#E3E2E0' },
  brown: { chip: '#EEE0DA', tint: '#F4EEEE', border: '#EADBD5' },
  orange: { chip: '#FADEC9', tint: '#FBECDD', border: '#F5DCC6' },
  yellow: { chip: '#FDECC8', tint: '#FBF3DB', border: '#F3E6BE' },
  green: { chip: '#DBEDDB', tint: '#EDF3EC', border: '#D6E6D4' },
  blue: { chip: '#D3E5EF', tint: '#E7F3F8', border: '#CFE3EE' },
  purple: { chip: '#E8DEEE', tint: '#F6F3F9', border: '#E5DCEC' },
  pink: { chip: '#F5E0E9', tint: '#FAF1F5', border: '#F1DCE6' },
  red: { chip: '#FFE2DD', tint: '#FDEBEC', border: '#F8D7D4' },
}

export const TAG_COLOR_ORDER: TagColorName[] = [
  'blue',
  'purple',
  'yellow',
  'green',
  'pink',
  'orange',
  'brown',
  'red',
  'gray',
]

// Tags created before the redesign stored Tailwind classes like "bg-blue-200".
const LEGACY: Record<string, TagColorName> = {
  'bg-gray-200': 'gray',
  'bg-blue-200': 'blue',
  'bg-purple-200': 'purple',
  'bg-yellow-200': 'yellow',
  'bg-green-200': 'green',
  'bg-teal-200': 'green',
  'bg-pink-200': 'pink',
  'bg-orange-200': 'orange',
  'bg-red-200': 'red',
}

export function tagColor(stored: string | null | undefined) {
  const name = (stored && (LEGACY[stored] || (stored in PALETTE ? stored : null))) || 'gray'
  return PALETTE[name as TagColorName]
}
