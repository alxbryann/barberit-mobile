/** Reset del stack raíz a la pestaña Catálogo dentro de MainTabs */
export const RESET_MAIN_AGENDA = {
  index: 0,
  routes: [
    {
      name: 'MainTabs',
      state: {
        routes: [{ name: 'Catalogo' }],
        index: 0,
      },
    },
  ],
};

/** Barbero: tabs Mi agenda, Mi perfil, Cerrar sesión */
export function resetToBarberMainTabs(slug) {
  return {
    index: 0,
    routes: [
      {
        name: 'MainTabs',
        state: {
          routes: [
            { name: 'MiAgenda', params: { slug } },
            { name: 'MiPerfil', params: { slug } },
            { name: 'CerrarSesion' },
          ],
          index: 0,
        },
      },
    ],
  };
}
