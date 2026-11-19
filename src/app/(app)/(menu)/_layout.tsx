import { Drawer } from 'expo-router/drawer';

import { AcoesDaBarra, BotaoDoMenu, Marca, useOpcoesDaBarra } from '@/components/barra-do-topo';
import { MenuLateral } from '@/components/menu-lateral';

/**
 * A navegação do site no celular: a barra do topo com ☰, a marca e a
 * pastilha (avisos, tema e conta), e o menu lateral que abre por cima.
 */
export default function Menu() {
  const barra = useOpcoesDaBarra();
  return (
    <Drawer
      drawerContent={(props) => <MenuLateral {...props} />}
      screenOptions={({ navigation }) => ({
        ...barra,
        headerTitle: () => <Marca />,
        headerTitleAlign: 'left',
        headerLeft: () => <BotaoDoMenu onPress={() => navigation.toggleDrawer()} />,
        headerRight: () => <AcoesDaBarra />,
        drawerStyle: { width: 260 },
      })}
    >
      {/* o Expo Router só mostra as telas declaradas aqui; quem aparece no menu é o `MenuLateral` */}
      <Drawer.Screen name="index" />
      <Drawer.Screen name="inscricoes" />
      <Drawer.Screen name="eventos" />
      <Drawer.Screen name="solicitacoes" />
      <Drawer.Screen name="oportunidades" />
    </Drawer>
  );
}
