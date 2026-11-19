/**
 * Conferência da lógica pura do app (sem React Native): `npm run verificar`.
 * Falha com o primeiro `assert` que quebrar.
 */
import assert from 'node:assert/strict';

import { ocupacao, podePagar, temTermo } from '../src/lib/eventos.ts';
import {
  isoDaData,
  mascaraCpf,
  mascaraTelefone,
  moeda,
  periodo,
  preco,
} from '../src/lib/formato.ts';
import { lerHtml } from '../src/lib/html.ts';

// HTML do editor (Quill): parágrafos, listas, negrito, links, entidades
const blocos = lerHtml(
  '<h2>Regras</h2><p>Leia <strong>com atenção</strong> &amp; aceite.</p><p><br></p>' +
    '<ol><li>Um</li><li>Dois</li></ol><ul><li>Item</li></ul>' +
    '<p><a href="https://iccv.com.br">site</a> <a href="javascript:alert(1)">mal</a></p>'
);
assert.deepEqual(
  blocos.map((b) => [b.tipo, b.marcador ?? '', b.trechos.map((t) => t.texto).join('')]),
  [
    ['h', '', 'Regras'],
    ['p', '', 'Leia com atenção & aceite.'],
    ['li', '1.', 'Um'],
    ['li', '2.', 'Dois'],
    ['li', '•', 'Item'],
    ['p', '', 'site mal'],
  ]
);
assert.equal(blocos[1].trechos[1].negrito, true);
assert.equal(blocos[5].trechos[0].link, 'https://iccv.com.br');
assert.equal(blocos[5].trechos[2].link, undefined, 'javascript: não vira link');

// Máscaras e datas
assert.equal(mascaraCpf('12345678901'), '123.456.789-01');
assert.equal(mascaraTelefone('85999990000'), '(85) 99999-0000');
assert.equal(isoDaData('20/11/1993'), '1993-11-20');
assert.equal(isoDaData('31/02/2000'), null, 'data inexistente');
assert.equal(moeda(1600.2), 'R$ 1.600,20');
assert.equal(preco(0), 'Grátis');
assert.equal(periodo('2026-03-06T19:00:00', '2026-03-08T12:00:00'), '6 a 8 de março');
assert.equal(periodo(null, null), 'Data a definir');

// Regras de evento
const grupo = (capacity: number | null, registered: number) => ({
  id: 'g',
  name: 'G',
  capacity,
  active: true,
  opensAt: null,
  closesAt: null,
  roles: [{ id: 'r', price: 10, description: 'R', registered, waitlisted: 0 }],
});
assert.equal(ocupacao(grupo(null, 500)).esgotado, false, 'sem capacidade é sem limite');
assert.equal(ocupacao(grupo(10, 10)).esgotado, true);
assert.equal(ocupacao(grupo(10, 4)).restantes, 6);
assert.equal(temTermo('<p><br></p>'), false);
assert.equal(temTermo('<p>Aceito</p>'), true);
assert.equal(podePagar('WAITING', 'OTHER'), true, 'cobrança ainda não começou');
assert.equal(podePagar('WAITING', 'PIX'), false, 'cobrança em andamento');
assert.equal(podePagar('DECLINED', 'CREDIT_CARD'), true);
assert.equal(podePagar('PAID', 'PIX'), false);

console.log('verificação ok');
