/** As respostas da API que o app usa — os campos lidos, não o registro inteiro */

export type Modulo = 'EVENTS' | 'NEWS' | 'TREASURY' | 'REQUESTS' | 'OPPORTUNITIES';

/** `GET /auth/validate` */
export interface Usuario {
  id: string;
  role: number;
  fullName: string;
  email: string;
  cpf: string;
  badgeName: string | null;
  profilePhotoUrl: string | null;
  churchRoles: { role: number; church: { id: string; name: string } }[];
  memberChurch: { id: string; name: string; modulos: Modulo[] } | null;
}

export type StatusDoPagamento =
  | 'PAID'
  | 'IN_ANALYSIS'
  | 'DECLINED'
  | 'CANCELED'
  | 'WAITING'
  | 'REFUNDED';

export type MetodoDoPagamento =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'BOLETO'
  | 'WALLET'
  | 'OTHER';

export interface DadosDoEvento {
  coverUrl?: string;
  logoUrl?: string;
  colors?: { primary?: string; secondary?: string; tertiary?: string };
  shortDescription?: string;
  description?: string;
  localName?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  linkMaps?: string;
  hideVacancies?: boolean;
  showQuadrante?: boolean;
  modules?: { teams?: boolean };
  publicStore?: boolean;
  registrationTerm?: string;
  minorTermUrl?: string;
  minorAgeLimit?: number;
}

export type StatusDoEvento = 'ACTIVE' | 'INACTIVE' | 'TEST';

/** Um item de `GET /events` (catálogo) */
export interface EventoDoCatalogo {
  id: string;
  type: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: StatusDoEvento;
  data: DadosDoEvento;
  church: { id: string; name: string; status?: string } | null;
}

export interface Ingresso {
  id: string;
  price: number;
  description: string;
  registered: number;
  waitlisted: number;
}

export interface GrupoDoEvento {
  id: string;
  name: string;
  /** nulo: sem limite de vagas */
  capacity: number | null;
  active: boolean;
  opensAt: string | null;
  closesAt: string | null;
  roles: Ingresso[];
}

export interface Variante {
  id: string;
  name: string;
  /** nulo: sem limite */
  available: number | null;
}

export interface Produto {
  id: string;
  name: string;
  description?: string;
  price: number;
  /** data URLs; a primeira é a capa */
  images: string[];
  variants: Variante[];
}

/** `GET /events/:id` */
export interface Evento extends EventoDoCatalogo {
  churchId: string;
  church: {
    id: string;
    name: string;
    modulePayment?: boolean;
    chargesOnline?: boolean;
  };
  groupRoles: GrupoDoEvento[];
  products: Produto[];
}

/** `GET /users/:id/groups` */
export interface GruposDoUsuario {
  present: { id: string; name: string; eventId: string; link: string | null }[];
  waitlist: { id: string; eventId: string }[];
}

export interface ItemDeProduto {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: { id: string; name: string; product: { id: string; name: string } };
}

export type StatusDoMenor = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Um evento de `GET /users/:id/payments` (Minhas inscrições) */
export interface Inscricao {
  eventId: string;
  eventName: string;
  data: DadosDoEvento;
  /** a igreja cobra pelo site */
  modulePayment: boolean;
  certificateAvailable: boolean;
  minorApprovalStatus: StatusDoMenor;
  signedTermUrl: string | null;
  minorApprovalRejectionReason: string | null;
  registeredRoles: {
    roleId: string;
    description: string;
    group: string;
    price: number;
    paymentStatus: StatusDoPagamento | null;
    paymentMethod: MetodoDoPagamento | null;
    amount: number | null;
    products: ItemDeProduto[];
  }[];
  productPurchases: {
    id: string;
    status: StatusDoPagamento;
    method: MetodoDoPagamento | null;
    amount: number;
    createdAt: string;
    productItems: ItemDeProduto[];
  }[];
  waitlistRoles: { roleId: string; description: string; group: string; price: number }[];
}

/** `GET /events/:eventId/users/:userId/payments/pix/:referenceId` */
export interface PixDoCheckout {
  provider: string;
  providerLabel: string;
  eventName: string;
  amountCents: number | null;
  code: string;
  expiresAt: string;
  status: StatusDoPagamento;
  active: boolean;
}

export interface Noticia {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { fullName: string } | null;
  event: { id: string; name: string } | null;
  church: { id: string; name: string } | null;
}

export interface Notificacao {
  id: string;
  tipo: string;
  origemId: string | null;
  titulo: string;
  texto: string;
  churchId: string | null;
  data: string;
  lida: boolean;
}

export interface Quadrante {
  event: { name: string; periodo?: string; coverUrl?: string; logoUrl?: string };
  teams: {
    id: string;
    name: string;
    users: {
      id: string;
      fullName: string;
      profilePhotoUrl: string | null;
      cellphone: string | null;
      birthday: string | null;
      email: string | null;
      roleTeam: 'LEADER' | 'MEMBER';
    }[];
  }[];
}
