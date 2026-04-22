# Trading Journal - Project Guidelines

### Component Conventions

- **Styling**: Utilizar las clases de Tailwind, no utilizar la prop `style={{}}` y no utilizar archivos CSS separados
  - Example: `<div className="flex items-center gap-2">`
- **Hooks**: Use standard React patterns (`useState`, `useEffect`); no state library
- **i18n access**: Always via `useT()` hook from `lib/lang-context.tsx` for locale + translations
  - Returns: `{locale: string, setLocale: (l)=>void, t: (key)=>string}`
