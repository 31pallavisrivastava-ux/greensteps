import { BlockGrid, BlockOption, BlockSection } from './BlockOption'
import { INDIAN_CITY_OPTIONS } from '@carbon/shared'

interface CityPickerProps {
  value: string
  onChange: (city: string) => void
  id?: string
}

export function CityPicker({ value, onChange, id }: CityPickerProps) {
  const labelId = id ? `${id}-label` : 'city-label'

  return (
    <BlockSection label="City" labelId={labelId}>
      <BlockGrid labelledBy={labelId}>
        {INDIAN_CITY_OPTIONS.map((c) => (
          <BlockOption
            key={c.name}
            selected={value === c.name}
            onClick={() => onChange(c.name)}
            compact
          >
            {c.name}
          </BlockOption>
        ))}
      </BlockGrid>
    </BlockSection>
  )
}
