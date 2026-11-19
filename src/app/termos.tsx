import { useQuery } from '@tanstack/react-query';

import { Html } from '@/components/html';
import { Carregando, Falha, T, Tela } from '@/components/ui';
import { api } from '@/lib/api';
import { data } from '@/lib/formato';

/** O texto vigente dos Termos de Uso (rota pública: vale antes do login) */
export default function Termos() {
  const termos = useQuery({
    queryKey: ['termos'],
    queryFn: () =>
      api<{ version: string; content: string; summary: string[]; publishedAt: string }>('/terms'),
  });

  if (termos.isPending) return <Carregando />;
  if (termos.isError) return <Falha erro={termos.error} aoTentar={termos.refetch} />;

  return (
    <Tela>
      <T v="secundario">
        Versão {termos.data.version} · publicada em {data(termos.data.publishedAt)}
      </T>
      {termos.data.summary?.length > 0 && (
        <>
          <T v="subtitulo">Em resumo</T>
          {termos.data.summary.map((item, i) => (
            <T key={i}>• {item}</T>
          ))}
        </>
      )}
      <Html html={termos.data.content} />
    </Tela>
  );
}
