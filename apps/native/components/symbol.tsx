import { SymbolView, type SymbolViewProps } from "expo-symbols"

export function Symbol({
  name,
  size = 20,
  tintColor,
  weight = "regular",
  ...rest
}: Omit<SymbolViewProps, "name"> & {
  name: string
  size?: number
}) {
  return (
    <SymbolView
      name={name as SymbolViewProps["name"]}
      size={size}
      tintColor={tintColor}
      weight={weight}
      resizeMode="scaleAspectFit"
      {...rest}
    />
  )
}
