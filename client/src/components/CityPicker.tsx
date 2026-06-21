import { BlockGrid, BlockOption, BlockSection } from './BlockOption'
import { INDIAN_CITY_OPTIONS } from '@carbon/shared'
import { useRadioGroup } from '../lib/useRadioGroup'

interface CityPickerProps {
  value: string
  onChange: (city: string) => void
  id?: string
}

export function CityPicker({ value, onChange, id }: CityPickerProps) {
  const labelId = id ? `${id}-label` : 'city-label'
  const cityNames = INDIAN_CITY_OPTIONS.map((c) => c.name)
  const { onKeyDown } = useRadioGroup(value, cityNames, onChange)

  return (
    <BlockSection label="City" labelId={labelId}>
      <BlockGrid labelledBy={labelId} onKeyDown={onKeyDown}>
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
