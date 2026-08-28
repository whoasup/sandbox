export interface ToggleOption<TValue extends string = string> {
  readonly value: TValue;
  readonly label: string;
  readonly disabled?: boolean;
}
