import { Group, Pagination, Text } from '@mantine/core'

/**
 * Paginación de los resultados (HU-01: «de 10 en 10»). Va dentro de un <nav>
 * con nombre para que un lector de pantalla la anuncie como navegación, y
 * muestra en texto en qué página se está, no solo el número resaltado.
 */
export function Paginador({
  pagina,
  totalDePaginas,
  alCambiar,
}: {
  pagina: number
  totalDePaginas: number
  alCambiar: (pagina: number) => void
}) {
  return (
    <Group
      component="nav"
      aria-label="Páginas de resultados"
      justify="space-between"
      wrap="wrap"
      gap="sm"
    >
      <Text>
        Página {pagina} de {totalDePaginas}
      </Text>
      <Pagination
        value={pagina}
        total={totalDePaginas}
        onChange={alCambiar}
        size="md"
        withEdges
        getControlProps={(control) => {
          const etiquetas = {
            first: 'Primera página',
            previous: 'Página anterior',
            next: 'Página siguiente',
            last: 'Última página',
          } as const
          return { 'aria-label': etiquetas[control] }
        }}
      />
    </Group>
  )
}
