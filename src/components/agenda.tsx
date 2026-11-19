import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { situacaoPorEvento } from '@/lib/consultas';
import { ehCorHex } from '@/lib/eventos';
import { emAndamento, jaAcabou, MESES, periodo } from '@/lib/formato';
import type { EventoDoCatalogo, GruposDoUsuario } from '@/lib/tipos';

import { CaixaDoSite, CabecalhoDaCaixa } from './caixa-do-site';

/** evento longo (um acampamento de mês) não precisa marcar dia a dia além disso */
const DIAS_MARCADOS_POR_EVENTO = 62;
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const chaveDoDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const maiuscula = (t: string) => t[0].toUpperCase() + t.slice(1);

type MeuEvento = { evento: EventoDoCatalogo; naEspera: boolean };

/**
 * A agenda do Início, como a `MinhaAgenda` do site: o calendário do mês com
 * os dias dos meus eventos na cor de cada um e, embaixo, a lista em folhinhas.
 * Entram os eventos em que a pessoa está inscrita ou na lista de espera e que
 * ainda não acabaram.
 */
export function Agenda({ eventos, grupos }: { eventos: EventoDoCatalogo[]; grupos?: GruposDoUsuario }) {
  const cores = useTheme();
  const situacao = situacaoPorEvento(grupos);
  const meus: MeuEvento[] = eventos
    .filter((e) => situacao.has(e.id) && !jaAcabou(e.endDate) && e.startDate)
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
    .map((evento) => ({ evento, naEspera: situacao.get(evento.id) === 'espera' }));
  const acontecendo = meus.filter(({ evento }) => emAndamento(evento.startDate, evento.endDate));
  const proximos = meus.filter((m) => !acontecendo.includes(m));
  const corDe = (e: EventoDoCatalogo) => (ehCorHex(e.data?.colors?.primary) ? e.data.colors!.primary! : cores.primary);

  // os dias de cada evento; no dia de dois eventos, vale a cor do primeiro
  const marcados = new Map<string, EventoDoCatalogo>();
  for (const { evento } of meus) {
    const dia = new Date(evento.startDate!);
    dia.setHours(0, 0, 0, 0);
    const fim = new Date(evento.endDate ?? evento.startDate!);
    for (let passo = 0; dia <= fim && passo < DIAS_MARCADOS_POR_EVENTO; passo++) {
      if (!marcados.has(chaveDoDia(dia))) marcados.set(chaveDoDia(dia), evento);
      dia.setDate(dia.getDate() + 1);
    }
  }

  // abre no mês de hoje se algo está acontecendo; senão, no do próximo evento
  const [mes, setMes] = useState(() => {
    const base = !acontecendo.length && proximos.length ? new Date(proximos[0].evento.startDate!) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const vazios = mes.getDay();
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  // sempre 6 semanas, como o calendário do site: a caixa não muda de altura entre os meses
  const celulas = [
    ...Array(vazios).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ...Array(42 - vazios - diasNoMes).fill(null),
  ];
  const hoje = chaveDoDia(new Date());
  const mudarMes = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1));

  return (
    <CaixaDoSite>
      <CabecalhoDaCaixa icone="calendar-month-outline" titulo="Agenda de Inscrições" />

      <View style={styles.calendario}>
        <View style={styles.cabecalhoDoMes}>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: cores.text, paddingLeft: 12 }}>
            {maiuscula(MESES[mes.getMonth()])} {mes.getFullYear()}
          </Text>
          <Pressable accessibilityLabel="Mês anterior" hitSlop={8} onPress={() => mudarMes(-1)} style={styles.seta}>
            <MaterialIcons name="chevron-left" size={24} color={cores.textSecondary} />
          </Pressable>
          <Pressable accessibilityLabel="Próximo mês" hitSlop={8} onPress={() => mudarMes(1)} style={styles.seta}>
            <MaterialIcons name="chevron-right" size={24} color={cores.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.semana}>
          {SEMANA.map((d, i) => (
            <Text key={i} style={[styles.diaDaSemana, { color: cores.textSecondary }]}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.dias}>
          {celulas.map((dia, i) => {
            if (dia === null) return <View key={`v${i}`} style={styles.celula} />;
            const chave = chaveDoDia(new Date(mes.getFullYear(), mes.getMonth(), dia));
            const evento = marcados.get(chave);
            const cor = evento ? corDe(evento) : undefined;
            return (
              <View key={chave} style={styles.celula}>
                <View
                  accessibilityLabel={evento ? `${dia}: ${evento.name}` : undefined}
                  style={[
                    styles.dia,
                    !!cor && { backgroundColor: cor + '29' },
                    chave === hoje && { borderWidth: 1, borderColor: cores.textSecondary },
                  ]}
                >
                  <Text style={{ fontSize: 14, color: cor ?? cores.text, fontWeight: cor ? '700' : '400' }}>{dia}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {meus.length === 0 ? (
        <Text style={{ fontSize: 14, lineHeight: 20, color: cores.textSecondary, marginTop: 4 }}>
          Você não tem inscrição em eventos que vêm por aí. Quando se inscrever, eles aparecem aqui e ficam
          marcados no calendário.
        </Text>
      ) : (
        <View style={{ marginTop: 4, gap: 12 }}>
          <SecaoDaAgenda titulo="Acontecendo agora" eventos={acontecendo} corDe={corDe} />
          <SecaoDaAgenda titulo="Meus eventos" eventos={proximos} corDe={corDe} />
        </View>
      )}
    </CaixaDoSite>
  );
}

function SecaoDaAgenda({
  titulo,
  eventos,
  corDe,
}: {
  titulo: string;
  eventos: MeuEvento[];
  corDe: (e: EventoDoCatalogo) => string;
}) {
  const cores = useTheme();
  if (!eventos.length) return null;
  return (
    <View>
      <Text style={[styles.rotuloDaSecao, { color: cores.textSecondary }]}>{titulo.toUpperCase()}</Text>
      <View style={{ gap: 4 }}>
        {eventos.map(({ evento, naEspera }) => {
          const inicio = new Date(evento.startDate!);
          return (
            <Pressable
              key={evento.id}
              accessibilityRole="link"
              onPress={() => router.push(`/evento/${evento.id}`)}
              style={({ pressed }) => [styles.linha, pressed && { backgroundColor: cores.background }]}
            >
              {/* a barra na cor do evento — a mesma do calendário */}
              <View style={[styles.barra, { backgroundColor: corDe(evento) }]} />
              {/* a data em bloco, como folhinha */}
              <View style={[styles.folhinha, { backgroundColor: cores.primary + '1A' }]}>
                <Text style={{ fontSize: 18, fontWeight: '700', lineHeight: 20, color: cores.primary }}>
                  {inicio.getDate()}
                </Text>
                <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.42, color: cores.primary }}>
                  {MESES[inicio.getMonth()].slice(0, 3).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: cores.text }}>
                  {evento.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: cores.textSecondary }}>
                  {periodo(evento.startDate, evento.endDate)}
                  {naEspera ? ' · Lista de espera' : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendario: { width: '100%', maxWidth: 340, alignSelf: 'center', marginTop: 8 },
  cabecalhoDoMes: { flexDirection: 'row', alignItems: 'center', height: 40, marginBottom: 4 },
  seta: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  semana: { flexDirection: 'row' },
  diaDaSemana: { flex: 1, textAlign: 'center', fontSize: 12, lineHeight: 40 },
  dias: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  dia: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rotuloDaSecao: { fontSize: 11, fontWeight: '700', letterSpacing: 0.66, marginBottom: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, paddingLeft: 10, marginHorizontal: -8, borderRadius: 8 },
  barra: { alignSelf: 'stretch', width: 4, borderRadius: 999 },
  folhinha: { width: 44, paddingVertical: 4, borderRadius: 8, alignItems: 'center' },
});
