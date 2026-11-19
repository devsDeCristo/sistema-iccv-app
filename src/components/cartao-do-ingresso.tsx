import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { ehCorHex, pagamentosEmAberto } from "@/lib/eventos";
import { periodo } from "@/lib/formato";
import type { EventoDoCatalogo, Inscricao } from "@/lib/tipos";

import { Veu } from "./degrade";
import { Chip, type Icone } from "./ui";

const CAPA_PADRAO = require("@/assets/images/capa-padrao.jpg");

/** Raio dos cantos: o `borderRadius` do tema do site (4) × 3 */
const RAIO = 12;
/** Raio do furo do picote, entre o ingresso e o canhoto */
const FURO = 12;

const ROTULO_DO_MENOR = {
  PENDING: "Liberação pendente",
  APPROVED: "Liberação aprovada",
  REJECTED: "Termo recusado",
} as const;

/**
 * O contorno do ingresso com os furos do picote: cantos arredondados e, na
 * altura do picote (`corte`), uma meia-lua recortada de cada lado. É recorte
 * de verdade, e não bolinha pintada na cor do fundo — como no site, a sombra
 * segue o desenho e contorna os furos.
 */
const contorno = (w: number, h: number, corte: number) =>
  [
    `M${RAIO},0 H${w - RAIO} A${RAIO},${RAIO} 0 0 1 ${w},${RAIO}`,
    `V${corte - FURO} A${FURO},${FURO} 0 0 0 ${w},${corte + FURO}`,
    `V${h - RAIO} A${RAIO},${RAIO} 0 0 1 ${w - RAIO},${h} H${RAIO} A${RAIO},${RAIO} 0 0 1 0,${h - RAIO}`,
    `V${corte + FURO} A${FURO},${FURO} 0 0 0 0,${corte - FURO} V${RAIO} A${RAIO},${RAIO} 0 0 1 ${RAIO},0 Z`,
  ].join(" ");

/** O chip contornado padrão do MUI (os tipos de ingresso) */
function ChipContornado({ texto, icone }: { texto: string; icone: Icone }) {
  const cores = useTheme();
  return (
    <View style={[styles.chipContornado, { borderColor: cores.chipBorda }]}>
      <MaterialIcons name={icone} size={18} color={cores.chipIcone} />
      <Text
        style={{ color: cores.text, fontSize: 13, flexShrink: 1 }}
        numberOfLines={1}
      >
        {texto}
      </Text>
    </View>
  );
}

/**
 * A inscrição no formato de ingresso, como o `EventCard` do site: a parte
 * principal com o evento (capa, nome, quando e os tipos de ingresso) e,
 * depois do picote, o canhoto com a situação da inscrição e dos pagamentos.
 *
 * `compacto` é a versão do Início (a coluna estreita da home do site): capa
 * mais baixa e o canhoto numa linha só. Sem ele, é a de Minhas inscrições no
 * celular: o canhoto empilhado e centralizado.
 */
export function CartaoDoIngresso({
  inscricao,
  evento,
  compacto = false,
}: {
  inscricao: Inscricao;
  evento?: EventoDoCatalogo;
  compacto?: boolean;
}) {
  const cores = useTheme();
  const escuro = useColorScheme() === "dark";
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const [corte, setCorte] = useState(0);

  const dados = inscricao.data ?? {};
  const cor = ehCorHex(dados.colors?.primary)
    ? dados.colors!.primary!
    : cores.primary;
  const local =
    dados.localName || [dados.city, dados.state].filter(Boolean).join(" · ");
  const inscrito = inscricao.registeredRoles.length > 0;
  const naEspera = inscricao.waitlistRoles.length > 0;
  const compras = inscricao.productPurchases.length;
  const emAberto = pagamentosEmAberto(inscricao);
  const menor = inscricao.minorApprovalStatus;

  // cada regra é um tipo de ingresso; as da lista de espera vêm marcadas
  const tipos = [
    ...inscricao.registeredRoles.map((r) => ({
      chave: r.roleId,
      texto: `${r.group} · ${r.description}`,
      espera: false,
    })),
    ...inscricao.waitlistRoles.map((r) => ({
      chave: `espera:${r.roleId}`,
      texto: `${r.group} · ${r.description} (espera)`,
      espera: true,
    })),
  ];

  const corDoMenor =
    menor === "APPROVED"
      ? cores.chips.success
      : menor === "REJECTED"
        ? cores.chips.canceled
        : cores.chips.pending;
  const tamanhoDoSelo = compacto ? 28 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Detalhes da inscrição em ${inscricao.eventName}`}
      onPress={() => router.push(`/ingresso/${inscricao.eventId}`)}
      onLayout={(e) =>
        setTamanho({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
      style={({ pressed }) => [
        escuro ? sombraEscura : sombraClara,
        pressed && { transform: [{ translateY: -2 }] },
      ]}
    >
      {tamanho.w > 0 && corte > 0 && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={tamanho.w}
          height={tamanho.h}
        >
          <Path
            d={contorno(tamanho.w, tamanho.h, corte)}
            fill={cores.card}
            // no escuro o site contorna com um fio claro de 1px (o primeiro drop-shadow)
            stroke={escuro ? "rgba(255,255,255,0.16)" : "none"}
            strokeWidth={escuro ? 1 : 0}
          />
          <Line
            x1={FURO + 2}
            x2={tamanho.w - FURO - 2}
            y1={corte}
            y2={corte}
            stroke={cores.picote}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </Svg>
      )}

      <View onLayout={(e) => setCorte(e.nativeEvent.layout.height)}>
        <View style={[styles.capa, { height: compacto ? 56 : 64 }]}>
          <Image
            source={dados.coverUrl ? { uri: dados.coverUrl } : CAPA_PADRAO}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <Veu />
          {!!dados.logoUrl && (
            <Image
              source={{ uri: dados.logoUrl }}
              style={{ width: "60%", height: compacto ? 32 : 48 }}
              contentFit="contain"
            />
          )}
        </View>

        <View
          style={{
            padding: compacto ? 16 : 20,
            paddingTop: compacto ? 10 : 12,
            gap: compacto ? 6 : 8,
          }}
        >
          <View>
            <Text style={[styles.rotulo, { color: cor }]}>INGRESSO</Text>
            <Text
              numberOfLines={2}
              style={{
                color: cores.text,
                fontSize: compacto ? 15 : 16,
                fontWeight: "700",
                lineHeight: compacto ? 19.5 : 20.8,
              }}
            >
              {inscricao.eventName}
            </Text>
          </View>

          {evento?.startDate ? (
            <View style={styles.linha}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={18}
                color={cores.textSecondary}
              />
              <Text
                style={{
                  color: cores.textSecondary,
                  fontSize: 14,
                  flexShrink: 1,
                }}
              >
                {periodo(evento.startDate, evento.endDate, true)}
              </Text>
            </View>
          ) : (
            !!local && (
              <View style={styles.linha}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={18}
                  color={cores.textSecondary}
                />
                <Text
                  style={{
                    color: cores.textSecondary,
                    fontSize: 14,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {local}
                </Text>
              </View>
            )
          )}

          {(tipos.length > 0 || compras > 0) && (
            <View style={styles.chips}>
              {tipos.map((t) => (
                <ChipContornado
                  key={t.chave}
                  texto={t.texto}
                  icone={t.espera ? "hourglass-bottom" : "local-activity"}
                />
              ))}
              {compras > 0 && (
                <ChipContornado
                  texto={
                    compras === 1
                      ? "1 compra na loja"
                      : `${compras} compras na loja`
                  }
                  icone="shopping-bag"
                />
              )}
            </View>
          )}

          {menor !== "NOT_REQUIRED" && (
            <Chip texto={ROTULO_DO_MENOR[menor]} cor={corDoMenor} />
          )}
        </View>
      </View>

      <View
        style={
          compacto
            ? [
                styles.canhoto,
                {
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: 12,
                },
              ]
            : [
                styles.canhoto,
                {
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 6,
                  padding: 16,
                },
              ]
        }
      >
        <View
          style={{
            flexDirection: compacto ? "row" : "column",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          <View
            style={{
              width: tamanhoDoSelo,
              height: tamanhoDoSelo,
              borderRadius: tamanhoDoSelo / 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: cor + "1F",
            }}
          >
            <MaterialIcons
              name={
                inscrito
                  ? "local-activity"
                  : naEspera
                    ? "hourglass-bottom"
                    : "shopping-bag"
              }
              size={compacto ? 16 : 24}
              color={cor}
            />
          </View>
          <Text
            style={{ color: cores.textSecondary, fontSize: 12 }}
            numberOfLines={compacto ? 1 : undefined}
          >
            {inscrito
              ? compacto
                ? "Confirmada"
                : "Inscrição confirmada"
              : naEspera
                ? "Na lista de espera"
                : "Compra na loja"}
          </Text>
        </View>

        {/* o status aparece mesmo na igreja que não cobra online: o que ela não
            tem é o botão de pagar, não a dívida */}
        {(inscrito || compras > 0) && (
          // a caixa em volta deixa o canhoto centralizar o chip (que se alinha ao início sozinho)
          <View>
            <Chip
              texto={
                emAberto === 0
                  ? "Tudo pago"
                  : compacto
                    ? `${emAberto} pendente${emAberto === 1 ? "" : "s"}`
                    : emAberto === 1
                      ? "1 pagamento pendente"
                      : `${emAberto} pagamentos pendentes`
              }
              cor={emAberto === 0 ? cores.chips.success : cores.chips.alert}
            />
          </View>
        )}
        {!inscricao.modulePayment && emAberto > 0 && (
          <View
            style={[
              styles.linha,
              { gap: 4, width: compacto ? "100%" : undefined },
            ]}
          >
            <MaterialIcons
              name="info-outline"
              size={14}
              color={cores.textSecondary}
            />
            <Text
              style={{
                color: cores.textSecondary,
                fontSize: 12,
                lineHeight: 15.6,
              }}
            >
              Pague direto à organização
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/**
 * A sombra do site, em `drop-shadow`, que segue o recorte: no Android pelo
 * `filter`; no iOS, a sombra de camada de uma vista sem fundo já segue o
 * desenho.
 */
const sombraClara = Platform.select({
  web: {
    filter:
      "drop-shadow(0px 1px 1px rgba(16,24,40,0.06)) drop-shadow(0px 6px 10px rgba(16,24,40,0.08))",
  },
  android: {
    filter:
      "drop-shadow(0px 1px 1px rgba(16,24,40,0.06)) drop-shadow(0px 6px 10px rgba(16,24,40,0.08))",
  },
  default: {
    shadowColor: "#101828",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
});
const sombraEscura = Platform.select({
  web: { filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.45))" },
  android: { filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.45))" },
  default: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});

const styles = StyleSheet.create({
  capa: {
    borderTopLeftRadius: RAIO,
    borderTopRightRadius: RAIO,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  rotulo: { fontSize: 11, fontWeight: "700", letterSpacing: 0.88 },
  linha: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chipContornado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 4,
    paddingRight: 8,
    maxWidth: "100%",
  },
  canhoto: { alignItems: "center" },
});
