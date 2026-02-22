// Enterprise Demo - CRM kerfi fyrir Enterprise bílaleigu
// Byggt á raunverulegu þjónustuframboði Enterprise Leiga (enterpriseleiga.is)

export type Svid = 'flotaleiga' | 'langtimaleiga';

export type BilaFlokkur =
  | 'Smábílar'
  | 'Fólksbílar'
  | 'Jepplingar'
  | 'Jeppar'
  | 'Hybrid'
  | 'Plug-in hybrid'
  | 'Rafmagnsbílar'
  | 'Sendibílar';

export interface TengiliðurAthugasemd {
  id: string;
  texti: string;
  dagsetning: string;
  hofundur: string;
}

export interface TengiliðurSamskipti {
  id: string;
  tegund: 'símtal' | 'tölvupóstur' | 'fundur' | 'heimsókn' | 'annað';
  titill: string;
  lysing: string;
  dagsetning: string;
  hofundur: string;
}

export type TengiliðurStaða = 'virkur' | 'óvirkur' | 'lead' | 'fyrrverandi';

export interface Tengiliður {
  id: string;
  nafn: string;
  titill: string;
  simi: string;
  netfang: string;
  aðaltengiliður: boolean;
  ahugamal?: string[];
  athugasemdir?: TengiliðurAthugasemd[];
  samskipti?: TengiliðurSamskipti[];
  markhópar?: string[];
  herferðir?: string[];
  staða?: TengiliðurStaða;
}

export interface Markhópur {
  id: string;
  nafn: string;
  lysing: string;
  litur: string;
}

export interface Herferð {
  id: string;
  nafn: string;
  lysing: string;
  dagsetning: string;
  status: 'virk' | 'lokið' | 'áætluð';
  litur: string;
}

export interface EmailTemplate {
  id: string;
  nafn: string;
  lysing: string;
  efni: string;
  texti: string;
  flokkur: 'boðsmiði' | 'tilkynning' | 'kynning' | 'eftirfylgni';
}

export interface Fyrirtaeki {
  id: string;
  nafn: string;
  kennitala: string;
  heimilisfang: string;
  svid: Svid;
  tengiliðir: Tengiliður[];
  virktSamningar: number;
  bilar: number;
  stofnad: string;
  pipiTegund: 'floti' | 'vinnuferdir' | 'sendibilar' | 'serpantanir' | 'langtimaleiga';
}

export interface Samningur {
  id: string;
  fyrirtaekiId: string;
  tegund: Svid;
  bilanumer: string;
  bilategund: string;
  upphafsdagur: string;
  lokadagur: string;
  manadalegurKostnadur: number;
  tryggingarPakki: 'Enterprise' | 'Plús' | 'Úrvals';
  aksturKmManudir: number;
  status: 'virkur' | 'rennur_ut' | 'lokid' | 'uppsagt';
  athugasemdir: string;
}

export interface Bill {
  id: string;
  numer: string;
  tegund: string;
  arsgerð: number;
  litur: string;
  ekinkm: number;
  fyrirtaekiId: string | null;
  samningurId: string | null;
  naestiThjonusta: string;
  sidastaThjonusta: string;
  bilaFlokkur: BilaFlokkur;
  skiptigerð: 'Sjálfskiptur' | 'Beinskiptur';
  verdFra: number;
  status: 'í leigu' | 'laus' | 'í þjónustu' | 'uppseldur';
  imageUrl?: string;
}

export interface Solutaekifaeri {
  id: string;
  fyrirtaekiId: string;
  tengiliðurId: string;
  titill: string;
  lysing: string;
  stig: 'lead' | 'tilboð sent' | 'samningur í vinnslu' | 'lokað unnið' | 'lokað tapað';
  pipalineStig: number;
  verdmaeti: number;
  dagsetning: string;
  sidastiKontaktur: string;
  naestiKontaktur: string;
  pipiTegund: 'floti' | 'vinnuferdir' | 'sendibilar' | 'serpantanir' | 'langtimaleiga';
  ferlSkrefs: FerlSkref[];
}

export interface FerlSkref {
  id: string;
  nafn: string;
  lýsing: string;
  status: 'lokið' | 'í gangi' | 'bíður' | 'áætlað';
  dagsetning: string;
  sjálfvirkt: boolean;
}

export interface Thjonustuaminning {
  id: string;
  billId: string;
  tegund: 'þjónustuskoðun' | 'dekkjaskipti' | 'smurþjónusta' | 'olíuskipti' | 'hefðbundið viðhald';
  dagsAminningar: string;
  dagsThjonustu: string;
  status: 'áætluð' | 'áminning send' | 'lokið' | 'seinkað';
  sendtViðskiptavini: boolean;
  innriTilkynning: boolean;
}

export interface Mal {
  id: string;
  fyrirtaekiId: string;
  billId?: string;
  samningurId?: string;
  titill: string;
  lýsing: string;
  tegund: 'fyrirspurn' | 'kvörtun' | 'þjónustubeiðni' | 'tjón' | 'breyting á samningi' | 'annað';
  status: 'opið' | 'í vinnslu' | 'bíður viðskiptavinar' | 'lokað';
  forgangur: 'lágur' | 'miðlungs' | 'hár' | 'bráður';
  stofnad: string;
  sidastUppfaert: string;
  abyrgdaraðili: string;
  fundur?: { dagsetning: string; lýsing: string };
}

export interface ChecklistItem {
  id: string;
  texti: string;
  lokid: boolean;
  lokadAf?: string;
  deadline?: string;
  uthlutadA?: string;
  skilabod?: string;
}

export interface Athugasemd {
  id: string;
  texti: string;
  hofundur: string;
  dagsetning: string;
}

export interface VerkefniNotification {
  id: string;
  verkefniId: string;
  tilNotandaId: string;
  fraNafn: string;
  tegund: 'assignment' | 'status_breyting' | 'athugasemd' | 'aminning';
  skilabod: string;
  lesid: boolean;
  dagsetning: string;
}

export type Forgangur = 'brýnt' | 'hátt' | 'venjulegt' | 'lágt';

export interface Verkefni {
  id: string;
  titill: string;
  lýsing: string;
  samningurId?: string;
  fyrirtaekiId?: string;
  billId?: string;
  status: 'opið' | 'í gangi' | 'lokið';
  forgangur: Forgangur;
  dagsetning: string;
  deadline: string;
  sjálfvirkt: boolean;
  abyrgdaradili: string;
  stofnadAf: string;
  deild: 'langtímaleiga' | 'flotaleiga' | 'þjónusta' | 'sala';
  checklist: ChecklistItem[];
  athugasemdir: Athugasemd[];
}

export interface Activity {
  id: string;
  entityType: 'bill' | 'samningur' | 'fyrirtaeki' | 'mal';
  entityId: string;
  tegund: 'afhentur' | 'postur_sendur' | 'konnun_send' | 'thjonusta' | 'skil' | 'samningur_undirritadur' | 'tjon_skrad' | 'athugasemd';
  lýsing: string;
  dagsetning: string;
  notandi: string;
}

// ============ MOCK DATA ============

export const fyrirtaeki: Fyrirtaeki[] = [
  {
    id: 'f1',
    nafn: 'Ístak hf.',
    kennitala: '560269-6079',
    heimilisfang: 'Armúla 4, 108 Reykjavík',
    svid: 'langtimaleiga',
    pipiTegund: 'langtimaleiga',
    tengiliðir: [
      { id: 't1', nafn: 'Guðrún Helga', titill: 'Rekstrarstjóri', simi: '555-1234', netfang: 'gudrun@istak.is', aðaltengiliður: true,
        staða: 'virkur', markhópar: ['mh1', 'mh2'], herferðir: ['h1', 'h3'],
        ahugamal: ['Golf', 'Ferðalög', 'Rafbílar'],
        athugasemdir: [
          { id: 'ath1', texti: 'Mjög áhugasöm um rafbílavæðingu flotans. Vildi fá kynningu á nýjum VW ID.5 gerðum.', dagsetning: '2026-02-15', hofundur: 'Kristján' },
          { id: 'ath2', texti: 'Nefndi á fundi að samkeppnisaðili hafi boðið betri kjör. Þarf að bregðast hratt við.', dagsetning: '2026-01-20', hofundur: 'Anna Sigríður' },
        ],
        samskipti: [
          { id: 'ss1', tegund: 'fundur', titill: 'Ársfundur um flotastjórnun', lysing: 'Fórum yfir alla samninga og ræddum endurnýjun. Guðrún ánægð en vill sjá rafbílatilboð.', dagsetning: '2026-02-17', hofundur: 'Kristján' },
          { id: 'ss2', tegund: 'símtal', titill: 'Eftirfylgni eftir fund', lysing: 'Hringdi til að spyrjast fyrir um stöðu rafbílatilboðs. Lofaði svari fyrir 20. feb.', dagsetning: '2026-02-19', hofundur: 'Kristján' },
          { id: 'ss3', tegund: 'tölvupóstur', titill: 'Sent tilboð í 3 VW ID.5', lysing: 'Tilboð sent á Guðrúnu. Verð: 185.000 kr/mán per bíl, 36 mánaða samningur.', dagsetning: '2026-02-21', hofundur: 'Sigurður' },
        ],
      },
      { id: 't2', nafn: 'Jón Magnússon', titill: 'Verkefnastjóri', simi: '555-1235', netfang: 'jon@istak.is', aðaltengiliður: false,
        staða: 'virkur', markhópar: ['mh3'], herferðir: ['h2'],
        ahugamal: ['Fótbolti', 'Tölvuleikir'],
        athugasemdir: [
          { id: 'ath3', texti: 'Jón sér um daglegan rekstur bílanna. Hringir oft vegna þjónustu og viðhalds.', dagsetning: '2026-01-05', hofundur: 'María' },
        ],
        samskipti: [
          { id: 'ss4', tegund: 'símtal', titill: 'Vildi panta þjónustu', lysing: 'Bað um dekkjaskipti á 4 bílum. Bókaði tíma 25. feb.', dagsetning: '2026-02-20', hofundur: 'María' },
        ],
      },
    ],
    virktSamningar: 8,
    bilar: 12,
    stofnad: '2023-03-15',
  },
  {
    id: 'f2',
    nafn: 'Marel hf.',
    kennitala: '620483-0849',
    heimilisfang: 'Austurhrauni 9, 210 Garðabær',
    svid: 'langtimaleiga',
    pipiTegund: 'floti',
    tengiliðir: [
      { id: 't3', nafn: 'Anna Björk', titill: 'Fjármálastjóri', simi: '555-2345', netfang: 'anna@marel.com', aðaltengiliður: true,
        staða: 'virkur', markhópar: ['mh1', 'mh4'], herferðir: ['h1', 'h2'],
        ahugamal: ['Sjálfbærni', 'Fjármál', 'Hlaup'],
        athugasemdir: [
          { id: 'ath4', texti: 'Anna er mjög nákvæm í samningagerð. Vill alltaf samanburðartilboð.', dagsetning: '2026-02-01', hofundur: 'Helgi' },
        ],
        samskipti: [
          { id: 'ss5', tegund: 'fundur', titill: 'Samningaviðræður um rafbílaflota', lysing: 'Anna vildi sjá greiningu á heildarkostnaði (TCO) samanborið við dísel. Lofaði útreikningu.', dagsetning: '2026-02-18', hofundur: 'Helgi' },
          { id: 'ss6', tegund: 'tölvupóstur', titill: 'TCO greining send', lysing: 'Sent heildarkostnaðargreiningu. Rafbílar koma 12% betur út á 3 árum.', dagsetning: '2026-02-20', hofundur: 'Helgi' },
        ],
      },
      { id: 't4', nafn: 'Sigurður Óli', titill: 'Innkaupastjóri', simi: '555-2346', netfang: 'sigurdur@marel.com', aðaltengiliður: false,
        staða: 'virkur', markhópar: ['mh2', 'mh3'], herferðir: ['h3'],
        ahugamal: ['Bílar', 'Tækni'],
        samskipti: [
          { id: 'ss7', tegund: 'símtal', titill: 'Spurðist fyrir um nýja bíla', lysing: 'Vildi vita hvort Kia EV6 sé á boðstólnum. Sagði já og lofaði tilboði.', dagsetning: '2026-02-21', hofundur: 'Sigurður Jónsson' },
        ],
      },
      { id: 't5', nafn: 'Helga Rún', titill: 'Flutningsstjóri', simi: '555-2347', netfang: 'helga@marel.com', aðaltengiliður: false, staða: 'óvirkur', markhópar: ['mh3'], herferðir: [], ahugamal: ['Útivist', 'Ferðalög'] },
    ],
    virktSamningar: 15,
    bilar: 22,
    stofnad: '2022-09-01',
  },
  {
    id: 'f3',
    nafn: 'Landsvirkjun',
    kennitala: '420269-1299',
    heimilisfang: 'Háaleitisbraut 68, 103 Reykjavík',
    svid: 'flotaleiga',
    pipiTegund: 'floti',
    tengiliðir: [
      { id: 't6', nafn: 'Björn Þór', titill: 'Tæknistjóri', simi: '555-3456', netfang: 'bjorn@lv.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh2', 'mh4'], herferðir: ['h1'], ahugamal: ['Rafbílar', 'Tækni', 'Sjálfbærni', 'Golf'] },
    ],
    virktSamningar: 25,
    bilar: 40,
    stofnad: '2021-01-10',
  },
  {
    id: 'f4',
    nafn: 'Síminn hf.',
    kennitala: '510269-0299',
    heimilisfang: 'Ármúla 25, 108 Reykjavík',
    svid: 'langtimaleiga',
    pipiTegund: 'langtimaleiga',
    tengiliðir: [
      { id: 't7', nafn: 'Kristín Sól', titill: 'Framkvæmdastjóri', simi: '555-4567', netfang: 'kristin@siminn.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh1'], herferðir: ['h2', 'h3'], ahugamal: ['Ráðstefnur', 'Fjármál', 'Golf', 'Viðburðir'] },
      { id: 't8', nafn: 'Ragnar Freyr', titill: 'Bílastjóri', simi: '555-4568', netfang: 'ragnar@siminn.is', aðaltengiliður: false, staða: 'virkur', markhópar: ['mh3'], herferðir: [], ahugamal: ['Bílar', 'Fótbolti', 'Handknattleikur'] },
    ],
    virktSamningar: 6,
    bilar: 8,
    stofnad: '2024-02-20',
  },
  {
    id: 'f5',
    nafn: 'Eimskip hf.',
    kennitala: '690269-0449',
    heimilisfang: 'Korngarðar 2, 104 Reykjavík',
    svid: 'flotaleiga',
    pipiTegund: 'sendibilar',
    tengiliðir: [
      { id: 't9', nafn: 'Ólafur Karl', titill: 'Rekstrarstjóri', simi: '555-5678', netfang: 'olafur@eimskip.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh2', 'mh3'], herferðir: ['h1', 'h2'], ahugamal: ['Golf', 'Ferðalög', 'Útivist'] },
      { id: 't10', nafn: 'Sigríður Helga', titill: 'Innkaupastjóri', simi: '555-5679', netfang: 'sigridur@eimskip.is', aðaltengiliður: false, staða: 'lead', markhópar: ['mh4'], herferðir: ['h3'], ahugamal: ['Sjálfbærni', 'Heilsa og líðan', 'Hlaup'] },
    ],
    virktSamningar: 18,
    bilar: 30,
    stofnad: '2022-06-01',
  },
  {
    id: 'f6',
    nafn: 'Origo hf.',
    kennitala: '530275-0299',
    heimilisfang: 'Borgartúni 37, 105 Reykjavík',
    svid: 'langtimaleiga',
    pipiTegund: 'serpantanir',
    tengiliðir: [
      { id: 't11', nafn: 'Margrét Dóra', titill: 'Mannauðsstjóri', simi: '555-6789', netfang: 'margret@origo.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh1', 'mh4'], herferðir: ['h1'], ahugamal: ['Heilsa og líðan', 'Viðburðir', 'Listir og menning'] },
    ],
    virktSamningar: 4,
    bilar: 5,
    stofnad: '2024-08-15',
  },
  {
    id: 'f7',
    nafn: 'VÍS Tryggingar',
    kennitala: '690689-2009',
    heimilisfang: 'Ármúla 3, 108 Reykjavík',
    svid: 'langtimaleiga',
    pipiTegund: 'langtimaleiga',
    tengiliðir: [
      { id: 't12', nafn: 'Þórdís Björk', titill: 'Fjármálastjóri', simi: '555-7890', netfang: 'thordis@vis.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh1', 'mh2'], herferðir: ['h2'], ahugamal: ['Golf', 'Fjármál', 'Ráðstefnur', 'Ferðalög'] },
      { id: 't13', nafn: 'Guðmundur Arnar', titill: 'Sölumaður', simi: '555-7891', netfang: 'gudmundur@vis.is', aðaltengiliður: false, staða: 'fyrrverandi', markhópar: ['mh3'], herferðir: [], ahugamal: ['Fótbolti', 'Bílar'] },
    ],
    virktSamningar: 10,
    bilar: 14,
    stofnad: '2023-11-01',
  },
  {
    id: 'f8',
    nafn: 'Reykjavík Excursions',
    kennitala: '470169-0399',
    heimilisfang: 'BSÍ, 101 Reykjavík',
    svid: 'flotaleiga',
    pipiTegund: 'floti',
    tengiliðir: [
      { id: 't14', nafn: 'Hrafn Sigurðsson', titill: 'Flutningsstjóri', simi: '555-8901', netfang: 'hrafn@re.is', aðaltengiliður: true, staða: 'virkur', markhópar: ['mh2'], herferðir: ['h1', 'h3'], ahugamal: ['Ferðalög', 'Golf', 'Útivist', 'Fjölskylda'] },
    ],
    virktSamningar: 12,
    bilar: 20,
    stofnad: '2023-05-01',
  },
];

// Bílar byggðir á raunverulegu framboði Enterprise Leiga
export const bilar: Bill[] = [
  // Smábílar
  { id: 'b1', numer: 'KP-101', tegund: 'Kia Picanto', arsgerð: 2024, litur: 'Hvítur', ekinkm: 12300, fyrirtaekiId: 'f4', samningurId: 's7', naestiThjonusta: '2026-05-01', sidastaThjonusta: '2025-11-01', bilaFlokkur: 'Smábílar', skiptigerð: 'Beinskiptur', verdFra: 76900, status: 'í leigu', imageUrl: '/cars/kia-picanto.png' },
  { id: 'b2', numer: 'KP-102', tegund: 'Kia Picanto Auto', arsgerð: 2024, litur: 'Rauður', ekinkm: 8700, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-06-15', sidastaThjonusta: '2025-12-15', bilaFlokkur: 'Smábílar', skiptigerð: 'Sjálfskiptur', verdFra: 100900, status: 'laus', imageUrl: '/cars/kia-picanto.png' },
  { id: 'b3', numer: 'TA-201', tegund: 'Toyota Aygo', arsgerð: 2023, litur: 'Blár', ekinkm: 28400, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-04-10', sidastaThjonusta: '2025-10-10', bilaFlokkur: 'Smábílar', skiptigerð: 'Beinskiptur', verdFra: 76900, status: 'laus', imageUrl: '/cars/toyota-aygo.png' },
  // Fólksbílar
  { id: 'b4', numer: 'OC-301', tegund: 'Opel Corsa', arsgerð: 2024, litur: 'Grár', ekinkm: 15200, fyrirtaekiId: 'f7', samningurId: 's10', naestiThjonusta: '2026-04-01', sidastaThjonusta: '2025-10-01', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 106900, status: 'í leigu', imageUrl: '/cars/opel-corsa.png' },
  { id: 'b5', numer: 'HI-302', tegund: 'Hyundai I30 Wagon', arsgerð: 2023, litur: 'Svartur', ekinkm: 34500, fyrirtaekiId: 'f1', samningurId: 's1', naestiThjonusta: '2026-03-15', sidastaThjonusta: '2025-09-15', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 99900, status: 'í leigu', imageUrl: '/cars/hyundai-i30-wagon.png' },
  { id: 'b6', numer: 'HI-303', tegund: 'Hyundai I20', arsgerð: 2024, litur: 'Hvítur', ekinkm: 9800, fyrirtaekiId: 'f4', samningurId: 's12', naestiThjonusta: '2026-07-01', sidastaThjonusta: '2026-01-01', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 100900, status: 'í leigu', imageUrl: '/cars/hyundai-i20.png' },
  { id: 'b7', numer: 'KC-304', tegund: 'Kia Ceed Station', arsgerð: 2024, litur: 'Grár', ekinkm: 18200, fyrirtaekiId: 'f2', samningurId: 's3', naestiThjonusta: '2026-05-15', sidastaThjonusta: '2025-11-15', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 122900, status: 'í leigu', imageUrl: '/cars/kia-ceed-sw.png' },
  { id: 'b8', numer: 'SO-305', tegund: 'Škoda Octavia Wagon', arsgerð: 2024, litur: 'Blár', ekinkm: 22100, fyrirtaekiId: 'f2', samningurId: 's4', naestiThjonusta: '2026-06-01', sidastaThjonusta: '2025-12-01', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 163900, status: 'í leigu', imageUrl: '/cars/skoda-octavia-wagon.png' },
  // Jepplingar
  { id: 'b9', numer: 'KS-401', tegund: 'Kia Stonic', arsgerð: 2024, litur: 'Hvítur', ekinkm: 11400, fyrirtaekiId: 'f6', samningurId: 's9', naestiThjonusta: '2026-09-01', sidastaThjonusta: '2026-03-01', bilaFlokkur: 'Jepplingar', skiptigerð: 'Sjálfskiptur', verdFra: 110000, status: 'í leigu', imageUrl: '/cars/kia-stonic.png' },
  { id: 'b10', numer: 'HB-402', tegund: 'Hyundai Bayon', arsgerð: 2024, litur: 'Silfur', ekinkm: 14600, fyrirtaekiId: 'f7', samningurId: 's11', naestiThjonusta: '2026-05-01', sidastaThjonusta: '2025-11-01', bilaFlokkur: 'Jepplingar', skiptigerð: 'Sjálfskiptur', verdFra: 102900, status: 'í leigu', imageUrl: '/cars/hyundai-bayon.png' },
  { id: 'b11', numer: 'DD-403', tegund: 'Dacia Duster', arsgerð: 2023, litur: 'Grár', ekinkm: 31200, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-04-15', sidastaThjonusta: '2025-10-15', bilaFlokkur: 'Jepplingar', skiptigerð: 'Beinskiptur', verdFra: 105900, status: 'laus', imageUrl: '/cars/dacia-duster.png' },
  // Jeppar
  { id: 'b12', numer: 'KSP-501', tegund: 'Kia Sportage PHEV', arsgerð: 2024, litur: 'Svartur', ekinkm: 19200, fyrirtaekiId: 'f1', samningurId: 's2', naestiThjonusta: '2026-05-15', sidastaThjonusta: '2025-11-15', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 168900, status: 'í leigu', imageUrl: '/cars/kia-sportage.png' },
  { id: 'b13', numer: 'HT-502', tegund: 'Hyundai Tucson PHEV', arsgerð: 2024, litur: 'Hvítur', ekinkm: 24300, fyrirtaekiId: 'f2', samningurId: 's5', naestiThjonusta: '2026-04-01', sidastaThjonusta: '2025-10-01', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 160900, status: 'í leigu', imageUrl: '/cars/hyundai-tucson.png' },
  { id: 'b14', numer: 'SK-503', tegund: 'Škoda Kodiaq', arsgerð: 2024, litur: 'Hvítur', ekinkm: 16800, fyrirtaekiId: 'f3', samningurId: 's6', naestiThjonusta: '2026-03-01', sidastaThjonusta: '2025-09-01', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 186900, status: 'í leigu', imageUrl: '/cars/skoda-kodiaq.png' },
  { id: 'b15', numer: 'KSO-504', tegund: 'Kia Sorento PHEV', arsgerð: 2024, litur: 'Grár', ekinkm: 13500, fyrirtaekiId: 'f3', samningurId: 's13', naestiThjonusta: '2026-06-01', sidastaThjonusta: '2025-12-01', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 210900, status: 'í leigu', imageUrl: '/cars/kia-sorento.png' },
  { id: 'b16', numer: 'BX-505', tegund: 'BMW X5', arsgerð: 2023, litur: 'Svartur', ekinkm: 28700, fyrirtaekiId: 'f6', samningurId: 's14', naestiThjonusta: '2026-04-15', sidastaThjonusta: '2025-10-15', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 296900, status: 'í leigu', imageUrl: '/cars/bmw-x5.png' },
  { id: 'b17', numer: 'VX-506', tegund: 'Volvo XC-90 PHEV', arsgerð: 2024, litur: 'Silfur', ekinkm: 8200, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-08-01', sidastaThjonusta: '2026-02-01', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 295899, status: 'laus', imageUrl: '/cars/volvo-xc90.png' },
  { id: 'b18', numer: 'TL-507', tegund: 'Toyota Land Cruiser', arsgerð: 2023, litur: 'Hvítur', ekinkm: 42100, fyrirtaekiId: 'f3', samningurId: 's15', naestiThjonusta: '2026-03-10', sidastaThjonusta: '2025-09-10', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 236899, status: 'í leigu', imageUrl: '/cars/toyota-land-cruiser.png' },
  { id: 'b19', numer: 'JC-508', tegund: 'Jeep Compass PHEV', arsgerð: 2023, litur: 'Rauður', ekinkm: 21900, fyrirtaekiId: 'f8', samningurId: 's16', naestiThjonusta: '2026-04-20', sidastaThjonusta: '2025-10-20', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 134900, status: 'í leigu', imageUrl: '/cars/jeep-compass.png' },
  { id: 'b20', numer: 'JR-509', tegund: 'Jeep Renegade PHEV', arsgerð: 2023, litur: 'Blár', ekinkm: 19400, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-05-01', sidastaThjonusta: '2025-11-01', bilaFlokkur: 'Jeppar', skiptigerð: 'Sjálfskiptur', verdFra: 100900, status: 'laus', imageUrl: '/cars/jeep-renegade.png' },
  // Plug-in hybrid
  { id: 'b21', numer: 'KN-601', tegund: 'Kia Niro PHEV', arsgerð: 2024, litur: 'Hvítur', ekinkm: 10200, fyrirtaekiId: 'f7', samningurId: 's17', naestiThjonusta: '2026-07-15', sidastaThjonusta: '2026-01-15', bilaFlokkur: 'Plug-in hybrid', skiptigerð: 'Sjálfskiptur', verdFra: 130900, status: 'í leigu', imageUrl: '/cars/kia-niro.png' },
  { id: 'b22', numer: 'KSM-602', tegund: 'Kia Sportage MHEV', arsgerð: 2024, litur: 'Grár', ekinkm: 17800, fyrirtaekiId: 'f8', samningurId: 's18', naestiThjonusta: '2026-05-01', sidastaThjonusta: '2025-11-01', bilaFlokkur: 'Hybrid', skiptigerð: 'Sjálfskiptur', verdFra: 160900, status: 'í leigu', imageUrl: '/cars/kia-sportage.png' },
  // Rafmagnsbílar
  { id: 'b23', numer: 'VW-701', tegund: 'VW ID.5', arsgerð: 2023, litur: 'Hvítur', ekinkm: 22400, fyrirtaekiId: 'f2', samningurId: 's19', naestiThjonusta: '2026-06-01', sidastaThjonusta: '2025-12-01', bilaFlokkur: 'Rafmagnsbílar', skiptigerð: 'Sjálfskiptur', verdFra: 180900, status: 'í leigu', imageUrl: '/cars/vw-id5.png' },
  { id: 'b24', numer: 'TM-702', tegund: 'Tesla Model Y Long Range', arsgerð: 2023, litur: 'Svartur', ekinkm: 31200, fyrirtaekiId: 'f2', samningurId: 's20', naestiThjonusta: '2026-04-15', sidastaThjonusta: '2025-10-15', bilaFlokkur: 'Rafmagnsbílar', skiptigerð: 'Sjálfskiptur', verdFra: 180900, status: 'í leigu', imageUrl: '/cars/tesla-model-y.png' },
  // Sendibílar
  { id: 'b25', numer: 'SB-801', tegund: 'VW Transporter', arsgerð: 2024, litur: 'Hvítur', ekinkm: 45200, fyrirtaekiId: 'f5', samningurId: 's8', naestiThjonusta: '2026-02-25', sidastaThjonusta: '2025-08-25', bilaFlokkur: 'Sendibílar', skiptigerð: 'Sjálfskiptur', verdFra: 195000, status: 'í leigu', imageUrl: '/cars/vw-transporter.png' },
  { id: 'b26', numer: 'SB-802', tegund: 'Mercedes Sprinter', arsgerð: 2024, litur: 'Hvítur', ekinkm: 38900, fyrirtaekiId: 'f5', samningurId: 's21', naestiThjonusta: '2026-03-15', sidastaThjonusta: '2025-09-15', bilaFlokkur: 'Sendibílar', skiptigerð: 'Sjálfskiptur', verdFra: 245000, status: 'í leigu', imageUrl: '/cars/mercedes-sprinter.png' },
  { id: 'b27', numer: 'SB-803', tegund: 'Ford Transit', arsgerð: 2023, litur: 'Hvítur', ekinkm: 52100, fyrirtaekiId: 'f5', samningurId: 's22', naestiThjonusta: '2026-03-01', sidastaThjonusta: '2025-09-01', bilaFlokkur: 'Sendibílar', skiptigerð: 'Sjálfskiptur', verdFra: 215000, status: 'í leigu', imageUrl: '/cars/ford-transit.png' },
  // Í þjónustu
  { id: 'b28', numer: 'HI-304', tegund: 'Hyundai I30', arsgerð: 2023, litur: 'Grár', ekinkm: 38900, fyrirtaekiId: null, samningurId: null, naestiThjonusta: '2026-03-10', sidastaThjonusta: '2025-09-10', bilaFlokkur: 'Fólksbílar', skiptigerð: 'Sjálfskiptur', verdFra: 89900, status: 'í þjónustu', imageUrl: '/cars/hyundai-i30.png' },
];

export const samningar: Samningur[] = [
  { id: 's1', fyrirtaekiId: 'f1', tegund: 'langtimaleiga', bilanumer: 'HI-302', bilategund: 'Hyundai I30 Wagon', upphafsdagur: '2025-04-01', lokadagur: '2026-03-31', manadalegurKostnadur: 99900, tryggingarPakki: 'Plús', aksturKmManudir: 1300, status: 'rennur_ut', athugasemdir: 'Viðskiptavinur vill endurnýja' },
  { id: 's2', fyrirtaekiId: 'f1', tegund: 'langtimaleiga', bilanumer: 'KSP-501', bilategund: 'Kia Sportage PHEV', upphafsdagur: '2025-06-15', lokadagur: '2026-06-14', manadalegurKostnadur: 168900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's3', fyrirtaekiId: 'f2', tegund: 'langtimaleiga', bilanumer: 'KC-304', bilategund: 'Kia Ceed Station', upphafsdagur: '2025-01-01', lokadagur: '2027-01-01', manadalegurKostnadur: 122900, tryggingarPakki: 'Úrvals', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's4', fyrirtaekiId: 'f2', tegund: 'langtimaleiga', bilanumer: 'SO-305', bilategund: 'Škoda Octavia Wagon', upphafsdagur: '2024-09-01', lokadagur: '2026-08-31', manadalegurKostnadur: 163900, tryggingarPakki: 'Plús', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's5', fyrirtaekiId: 'f2', tegund: 'flotaleiga', bilanumer: 'HT-502', bilategund: 'Hyundai Tucson PHEV', upphafsdagur: '2024-06-01', lokadagur: '2026-05-31', manadalegurKostnadur: 160900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: 'Flotasamningur' },
  { id: 's6', fyrirtaekiId: 'f3', tegund: 'flotaleiga', bilanumer: 'SK-503', bilategund: 'Škoda Kodiaq', upphafsdagur: '2024-01-01', lokadagur: '2026-12-31', manadalegurKostnadur: 186900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: 'Floti - stór samningur' },
  { id: 's7', fyrirtaekiId: 'f4', tegund: 'langtimaleiga', bilanumer: 'KP-101', bilategund: 'Kia Picanto', upphafsdagur: '2025-08-01', lokadagur: '2026-07-31', manadalegurKostnadur: 76900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's8', fyrirtaekiId: 'f5', tegund: 'flotaleiga', bilanumer: 'SB-801', bilategund: 'VW Transporter', upphafsdagur: '2024-03-01', lokadagur: '2026-02-28', manadalegurKostnadur: 195000, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'rennur_ut', athugasemdir: 'Rennur út eftir 8 daga!' },
  { id: 's9', fyrirtaekiId: 'f6', tegund: 'langtimaleiga', bilanumer: 'KS-401', bilategund: 'Kia Stonic', upphafsdagur: '2025-10-01', lokadagur: '2027-09-30', manadalegurKostnadur: 110000, tryggingarPakki: 'Plús', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's10', fyrirtaekiId: 'f7', tegund: 'langtimaleiga', bilanumer: 'OC-301', bilategund: 'Opel Corsa', upphafsdagur: '2025-03-01', lokadagur: '2026-02-28', manadalegurKostnadur: 106900, tryggingarPakki: 'Úrvals', aksturKmManudir: 1300, status: 'rennur_ut', athugasemdir: 'Skoða endurnýjun' },
  { id: 's11', fyrirtaekiId: 'f7', tegund: 'langtimaleiga', bilanumer: 'HB-402', bilategund: 'Hyundai Bayon', upphafsdagur: '2025-05-01', lokadagur: '2026-04-30', manadalegurKostnadur: 102900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's12', fyrirtaekiId: 'f4', tegund: 'langtimaleiga', bilanumer: 'HI-303', bilategund: 'Hyundai I20', upphafsdagur: '2025-09-01', lokadagur: '2026-08-31', manadalegurKostnadur: 100900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's13', fyrirtaekiId: 'f3', tegund: 'flotaleiga', bilanumer: 'KSO-504', bilategund: 'Kia Sorento PHEV', upphafsdagur: '2025-03-01', lokadagur: '2027-02-28', manadalegurKostnadur: 210900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
  { id: 's14', fyrirtaekiId: 'f6', tegund: 'langtimaleiga', bilanumer: 'BX-505', bilategund: 'BMW X5', upphafsdagur: '2025-01-01', lokadagur: '2026-12-31', manadalegurKostnadur: 296900, tryggingarPakki: 'Úrvals', aksturKmManudir: 1300, status: 'virkur', athugasemdir: 'Forstjórabíll' },
  { id: 's15', fyrirtaekiId: 'f3', tegund: 'flotaleiga', bilanumer: 'TL-507', bilategund: 'Toyota Land Cruiser', upphafsdagur: '2024-06-01', lokadagur: '2026-05-31', manadalegurKostnadur: 236899, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
  { id: 's16', fyrirtaekiId: 'f8', tegund: 'flotaleiga', bilanumer: 'JC-508', bilategund: 'Jeep Compass PHEV', upphafsdagur: '2025-02-01', lokadagur: '2026-01-31', manadalegurKostnadur: 134900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'lokid', athugasemdir: '' },
  { id: 's17', fyrirtaekiId: 'f7', tegund: 'langtimaleiga', bilanumer: 'KN-601', bilategund: 'Kia Niro PHEV', upphafsdagur: '2025-07-01', lokadagur: '2026-06-30', manadalegurKostnadur: 130900, tryggingarPakki: 'Plús', aksturKmManudir: 1300, status: 'virkur', athugasemdir: '' },
  { id: 's18', fyrirtaekiId: 'f8', tegund: 'flotaleiga', bilanumer: 'KSM-602', bilategund: 'Kia Sportage MHEV', upphafsdagur: '2025-04-01', lokadagur: '2026-03-31', manadalegurKostnadur: 160900, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'rennur_ut', athugasemdir: '' },
  { id: 's19', fyrirtaekiId: 'f2', tegund: 'flotaleiga', bilanumer: 'VW-701', bilategund: 'VW ID.5', upphafsdagur: '2025-01-01', lokadagur: '2027-01-01', manadalegurKostnadur: 180900, tryggingarPakki: 'Plús', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
  { id: 's20', fyrirtaekiId: 'f2', tegund: 'flotaleiga', bilanumer: 'TM-702', bilategund: 'Tesla Model Y Long Range', upphafsdagur: '2024-06-01', lokadagur: '2026-05-31', manadalegurKostnadur: 180900, tryggingarPakki: 'Úrvals', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
  { id: 's21', fyrirtaekiId: 'f5', tegund: 'flotaleiga', bilanumer: 'SB-802', bilategund: 'Mercedes Sprinter', upphafsdagur: '2024-09-01', lokadagur: '2026-08-31', manadalegurKostnadur: 245000, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
  { id: 's22', fyrirtaekiId: 'f5', tegund: 'flotaleiga', bilanumer: 'SB-803', bilategund: 'Ford Transit', upphafsdagur: '2024-06-01', lokadagur: '2026-05-31', manadalegurKostnadur: 215000, tryggingarPakki: 'Enterprise', aksturKmManudir: 1000, status: 'virkur', athugasemdir: '' },
];

export const solutaekifaeri: Solutaekifaeri[] = [
  {
    id: 'so1', fyrirtaekiId: 'f2', tengiliðurId: 't4', titill: 'Marel - Stækkun rafbílaflota',
    lysing: 'Marel vill bæta við 5 rafbílum (VW ID.5 eða Tesla) í flotann',
    stig: 'tilboð sent', pipalineStig: 3, verdmaeti: 10800000, dagsetning: '2026-01-15',
    sidastiKontaktur: '2026-02-10', naestiKontaktur: '2026-02-25', pipiTegund: 'floti',
    ferlSkrefs: [
      { id: 'fs1', nafn: 'Fyrirspurn móttekin', lýsing: 'Sigurður hringdi', status: 'lokið', dagsetning: '2026-01-15', sjálfvirkt: false },
      { id: 'fs2', nafn: 'Fundur bókaður', lýsing: 'Fundur á skrifstofu Marel', status: 'lokið', dagsetning: '2026-01-22', sjálfvirkt: false },
      { id: 'fs3', nafn: 'Tilboð sent', lýsing: 'Sent tilboð í 5 rafbíla', status: 'í gangi', dagsetning: '2026-02-10', sjálfvirkt: true },
      { id: 'fs4', nafn: 'Samningur undirritaður', lýsing: '', status: 'bíður', dagsetning: '', sjálfvirkt: false },
    ],
  },
  {
    id: 'so2', fyrirtaekiId: 'f4', tengiliðurId: 't7', titill: 'Síminn - Plug-in hybrid floti',
    lysing: 'Síminn vill skipta 4 bílum yfir í PHEV gerðir',
    stig: 'samningur í vinnslu', pipalineStig: 2, verdmaeti: 7200000, dagsetning: '2026-02-01',
    sidastiKontaktur: '2026-02-15', naestiKontaktur: '2026-02-22', pipiTegund: 'langtimaleiga',
    ferlSkrefs: [
      { id: 'fs5', nafn: 'Fyrirspurn móttekin', lýsing: 'Netfang frá Kristínu', status: 'lokið', dagsetning: '2026-02-01', sjálfvirkt: false },
      { id: 'fs6', nafn: 'Þarfagreining', lýsing: 'Greina núverandi flota og þarfir', status: 'í gangi', dagsetning: '2026-02-15', sjálfvirkt: false },
      { id: 'fs7', nafn: 'Tilboð sent', lýsing: '', status: 'bíður', dagsetning: '', sjálfvirkt: true },
    ],
  },
  {
    id: 'so3', fyrirtaekiId: 'f6', tengiliðurId: 't11', titill: 'Origo - Sérpöntun forstjórabíls',
    lysing: 'Origo óskar eftir Volvo XC-90 PHEV fyrir nýjan forstjóra',
    stig: 'lead', pipalineStig: 1, verdmaeti: 3600000, dagsetning: '2026-02-18',
    sidastiKontaktur: '2026-02-18', naestiKontaktur: '2026-02-21', pipiTegund: 'serpantanir',
    ferlSkrefs: [
      { id: 'fs8', nafn: 'Fyrirspurn móttekin', lýsing: 'Margrét sendi fyrirspurn', status: 'í gangi', dagsetning: '2026-02-18', sjálfvirkt: false },
    ],
  },
  {
    id: 'so4', fyrirtaekiId: 'f5', tengiliðurId: 't9', titill: 'Eimskip - 3 sendibílar til viðbótar',
    lysing: 'Eimskip þarf fleiri sendibíla vegna aukinna flutninga',
    stig: 'samningur í vinnslu', pipalineStig: 2, verdmaeti: 7800000, dagsetning: '2025-12-01',
    sidastiKontaktur: '2026-02-12', naestiKontaktur: '2026-03-01', pipiTegund: 'sendibilar',
    ferlSkrefs: [
      { id: 'fs9', nafn: 'Fundur', lýsing: 'Fundur með Ólafi', status: 'lokið', dagsetning: '2025-12-15', sjálfvirkt: false },
      { id: 'fs10', nafn: 'Greining', lýsing: 'Greining á flutningsþörfum', status: 'lokið', dagsetning: '2026-01-20', sjálfvirkt: false },
      { id: 'fs11', nafn: 'Tilboðsgerð', lýsing: 'Vinna tilboð á 3 sendibíla', status: 'í gangi', dagsetning: '2026-02-12', sjálfvirkt: false },
    ],
  },
  {
    id: 'so5', fyrirtaekiId: 'f1', tengiliðurId: 't1', titill: 'Ístak - Endurnýjun á samningi',
    lysing: 'Ístak vill endurnýja samning um Hyundai I30 Wagon og bæta við einum bíl',
    stig: 'lead', pipalineStig: 1, verdmaeti: 2400000, dagsetning: '2026-02-20',
    sidastiKontaktur: '2026-02-20', naestiKontaktur: '2026-02-24', pipiTegund: 'langtimaleiga',
    ferlSkrefs: [
      { id: 'fs12', nafn: 'Fyrirspurn móttekin', lýsing: 'Guðrún sendi fyrirspurn um endurnýjun', status: 'í gangi', dagsetning: '2026-02-20', sjálfvirkt: false },
    ],
  },
];

export const mal: Mal[] = [
  { id: 'm1', fyrirtaekiId: 'f1', billId: 'b5', titill: 'Dekkjaskipti á Hyundai I30W', lýsing: 'Viðskiptavinur óskar eftir sumardekkjum á HI-302', tegund: 'þjónustubeiðni', status: 'í vinnslu', forgangur: 'miðlungs', stofnad: '2026-02-10', sidastUppfaert: '2026-02-15', abyrgdaraðili: 'Helgi', fundur: { dagsetning: '2026-02-22', lýsing: 'Dekkjaskipti í verkstæði' } },
  { id: 'm2', fyrirtaekiId: 'f2', billId: 'b24', titill: 'Tesla hleðsluvandamál', lýsing: 'Vandamál við hleðslu á TM-702, þarf í þjónustu hjá Tesla', tegund: 'kvörtun', status: 'opið', forgangur: 'hár', stofnad: '2026-02-18', sidastUppfaert: '2026-02-18', abyrgdaraðili: 'Sigurður' },
  { id: 'm3', fyrirtaekiId: 'f5', titill: 'Úrvalspabbi á sendibíla', lýsing: 'Eimskip óskar eftir Úrvals tryggingarpakka á alla 3 sendibílana', tegund: 'breyting á samningi', status: 'bíður viðskiptavinar', forgangur: 'lágur', stofnad: '2026-02-05', sidastUppfaert: '2026-02-12', abyrgdaraðili: 'Anna' },
  { id: 'm4', fyrirtaekiId: 'f7', billId: 'b4', samningurId: 's10', titill: 'Skilamat á Opel Corsa', lýsing: 'Undirbúa skilamat á OC-301 vegna samningsloka', tegund: 'þjónustubeiðni', status: 'í vinnslu', forgangur: 'hár', stofnad: '2026-02-14', sidastUppfaert: '2026-02-19', abyrgdaraðili: 'Helgi', fundur: { dagsetning: '2026-02-27', lýsing: 'Skoðun á bíl hjá VÍS' } },
  { id: 'm5', fyrirtaekiId: 'f3', titill: 'Nýir jeppar í Landsvirkjun', lýsing: 'Landsvirkjun vill bæta 5 jeppum (Toyota Land Cruiser) í flotann', tegund: 'fyrirspurn', status: 'opið', forgangur: 'miðlungs', stofnad: '2026-02-19', sidastUppfaert: '2026-02-19', abyrgdaraðili: 'Kristján' },
  { id: 'm6', fyrirtaekiId: 'f8', billId: 'b19', titill: 'Tjón á Jeep Compass', lýsing: 'Minni háttar skemmdir á stuðara eftir bílastæðisóhapp', tegund: 'tjón', status: 'í vinnslu', forgangur: 'miðlungs', stofnad: '2026-02-16', sidastUppfaert: '2026-02-18', abyrgdaraðili: 'Helgi' },
  { id: 'm7', fyrirtaekiId: 'f2', samningurId: 's5', titill: 'Breyting á flotasamningi Marel', lýsing: 'Marel óskar eftir breytingu á akstursmörkum á samningi s5', tegund: 'breyting á samningi', status: 'bíður viðskiptavinar', forgangur: 'lágur', stofnad: '2026-02-12', sidastUppfaert: '2026-02-17', abyrgdaraðili: 'Anna' },
  { id: 'm8', fyrirtaekiId: 'f4', titill: 'Kvörtun vegna þjónustu', lýsing: 'Síminn kvartaði yfir seinkun á dekkjaskiptum', tegund: 'kvörtun', status: 'lokað', forgangur: 'miðlungs', stofnad: '2026-01-28', sidastUppfaert: '2026-02-05', abyrgdaraðili: 'Sigurður' },
];

export const thpilaFlokkar: BilaFlokkur[] = [
  'Smábílar', 'Fólksbílar', 'Jepplingar', 'Jeppar', 'Hybrid', 'Plug-in hybrid', 'Rafmagnsbílar', 'Sendibílar',
];

export const thpilaFlokkaLitir: Record<string, string> = {
  'Smábílar': '#f59e0b',
  'Fólksbílar': '#3b82f6',
  'Jepplingar': '#8b5cf6',
  'Jeppar': '#22c55e',
  'Hybrid': '#06b6d4',
  'Plug-in hybrid': '#10b981',
  'Rafmagnsbílar': '#6366f1',
  'Sendibílar': '#ef4444',
};

export const thjonustuaminningar: Thjonustuaminning[] = [
  { id: 'ta1', billId: 'b14', tegund: 'þjónustuskoðun', dagsAminningar: '2026-02-15', dagsThjonustu: '2026-03-01', status: 'áminning send', sendtViðskiptavini: true, innriTilkynning: true },
  { id: 'ta2', billId: 'b25', tegund: 'þjónustuskoðun', dagsAminningar: '2026-02-11', dagsThjonustu: '2026-02-25', status: 'áminning send', sendtViðskiptavini: true, innriTilkynning: true },
  { id: 'ta3', billId: 'b8', tegund: 'smurþjónusta', dagsAminningar: '2026-03-01', dagsThjonustu: '2026-03-15', status: 'áætluð', sendtViðskiptavini: false, innriTilkynning: true },
  { id: 'ta4', billId: 'b4', tegund: 'dekkjaskipti', dagsAminningar: '2026-03-18', dagsThjonustu: '2026-04-01', status: 'áætluð', sendtViðskiptavini: false, innriTilkynning: false },
  { id: 'ta5', billId: 'b28', tegund: 'hefðbundið viðhald', dagsAminningar: '2026-02-24', dagsThjonustu: '2026-03-10', status: 'áætluð', sendtViðskiptavini: false, innriTilkynning: true },
  { id: 'ta6', billId: 'b5', tegund: 'þjónustuskoðun', dagsAminningar: '2026-03-01', dagsThjonustu: '2026-03-15', status: 'áætluð', sendtViðskiptavini: false, innriTilkynning: false },
  { id: 'ta7', billId: 'b18', tegund: 'þjónustuskoðun', dagsAminningar: '2026-02-24', dagsThjonustu: '2026-03-10', status: 'áætluð', sendtViðskiptavini: true, innriTilkynning: true },
];

export const verkefni: Verkefni[] = [
  {
    id: 'v1', titill: 'Samningur rennur út - Ístak HI-302', lýsing: 'Langtímasamningur s1 rennur út 31. mars. Senda tölvupóst á viðskiptavin.', samningurId: 's1', fyrirtaekiId: 'f1', billId: 'b5', status: 'í gangi', forgangur: 'hátt', dagsetning: '2026-02-15', deadline: '2026-02-21', sjálfvirkt: false, abyrgdaradili: 'Anna', stofnadAf: 'Kerfið', deild: 'langtímaleiga',
    checklist: [
      { id: 'cl1', texti: 'Senda tölvupóst á Guðrúnu', lokid: true, lokadAf: 'Anna' },
      { id: 'cl2', texti: 'Fá staðfestingu á endurnýjun', lokid: false },
      { id: 'cl3', texti: 'Uppfæra samningsskjöl', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v2', titill: 'Samningur rennur út - Eimskip SB-801', lýsing: 'Flotasamningur s8 rennur út 28. feb. Senda innri tilkynningu.', samningurId: 's8', fyrirtaekiId: 'f5', billId: 'b25', status: 'í gangi', forgangur: 'brýnt', dagsetning: '2026-01-28', deadline: '2026-02-23', sjálfvirkt: true, abyrgdaradili: 'Kristján', stofnadAf: 'Kerfið', deild: 'flotaleiga',
    checklist: [
      { id: 'cl4', texti: 'Senda innri tilkynningu', lokid: true, lokadAf: 'Kristján' },
      { id: 'cl5', texti: 'Hafa samband við Ólaf Karl', lokid: true, lokadAf: 'Kristján' },
      { id: 'cl6', texti: 'Semja um endurnýjun', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v3', titill: 'Samningur rennur út - VÍS OC-301', lýsing: 'Langtímasamningur s10 rennur út 28. feb. Senda tölvupóst á Þórdísi.', samningurId: 's10', fyrirtaekiId: 'f7', billId: 'b4', status: 'opið', forgangur: 'brýnt', dagsetning: '2026-02-10', deadline: '2026-02-21', sjálfvirkt: false, abyrgdaradili: 'Anna', stofnadAf: 'Kerfið', deild: 'langtímaleiga',
    checklist: [
      { id: 'cl7', texti: 'Senda tölvupóst á Þórdísi', lokid: false },
      { id: 'cl8', texti: 'Bóka skilamat', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v4', titill: 'Samningur rennur út - RE KSM-602', lýsing: 'Flotasamningur s18 rennur út 31. mars. Senda innri tilkynningu.', samningurId: 's18', fyrirtaekiId: 'f8', billId: 'b22', status: 'opið', forgangur: 'hátt', dagsetning: '2026-02-18', deadline: '2026-02-24', sjálfvirkt: true, abyrgdaradili: 'Kristján', stofnadAf: 'Kerfið', deild: 'flotaleiga',
    checklist: [
      { id: 'cl9', texti: 'Senda innri tilkynningu', lokid: false },
      { id: 'cl10', texti: 'Hafa samband við Hrafn', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v5', titill: 'Eftirfylgni - Marel rafbílatilboð', lýsing: 'Fylgja eftir tilboði í 5 rafbíla', fyrirtaekiId: 'f2', status: 'í gangi', forgangur: 'hátt', dagsetning: '2026-02-17', deadline: '2026-02-22', sjálfvirkt: false, abyrgdaradili: 'Sigurður', stofnadAf: 'Anna', deild: 'sala',
    checklist: [
      { id: 'cl11', texti: 'Hringja í Sigurð Óla', lokid: true, lokadAf: 'Sigurður' },
      { id: 'cl12', texti: 'Senda uppfært tilboð', lokid: false },
      { id: 'cl13', texti: 'Bóka fund til samningagerðar', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v6', titill: 'Þjónustuskoðun - Škoda Kodiaq', lýsing: 'Bóka þjónustuskoðun á SK-503 í Škoda þjónustuna', billId: 'b14', fyrirtaekiId: 'f3', status: 'opið', forgangur: 'venjulegt', dagsetning: '2026-02-19', deadline: '2026-02-22', sjálfvirkt: true, abyrgdaradili: 'Helgi', stofnadAf: 'Kerfið', deild: 'þjónusta',
    checklist: [
      { id: 'cl14', texti: 'Hringja í Škoda þjónustuna', lokid: false },
      { id: 'cl15', texti: 'Bóka tíma', lokid: false },
      { id: 'cl16', texti: 'Láta Björn Þór vita', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v7', titill: 'Afhending á Volvo XC-90', lýsing: 'Undirbúa afhendingu á VX-506 ef samningur gengur í gegn', billId: 'b17', status: 'opið', forgangur: 'venjulegt', dagsetning: '2026-02-20', deadline: '2026-02-28', sjálfvirkt: false, abyrgdaradili: 'Anna', stofnadAf: 'Anna', deild: 'langtímaleiga',
    checklist: [
      { id: 'cl17', texti: 'Staðfesta samning við Origo', lokid: false },
      { id: 'cl18', texti: 'Undirbúa bíl til afhendingar', lokid: false },
      { id: 'cl19', texti: 'Skrá í kerfið', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v8', titill: 'Skilamat á VW Transporter', lýsing: 'Framkvæma skilamat á SB-801 vegna samningsloka', billId: 'b25', fyrirtaekiId: 'f5', samningurId: 's8', status: 'í gangi', forgangur: 'venjulegt', dagsetning: '2026-02-18', deadline: '2026-02-23', sjálfvirkt: true, abyrgdaradili: 'Helgi', stofnadAf: 'Kristján', deild: 'flotaleiga',
    checklist: [
      { id: 'cl20', texti: 'Skoða ástand bíls', lokid: true, lokadAf: 'Helgi' },
      { id: 'cl21', texti: 'Taka myndir', lokid: true, lokadAf: 'Helgi' },
      { id: 'cl22', texti: 'Fylla út skilaskýrslu', lokid: false },
      { id: 'cl23', texti: 'Senda skýrslu til Eimskip', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v9', titill: 'Síminn - PHEV ráðgjöf', lýsing: 'Bóka fund með Kristínu um PHEV valkosti', fyrirtaekiId: 'f4', status: 'opið', forgangur: 'lágt', dagsetning: '2026-02-19', deadline: '2026-02-21', sjálfvirkt: false, abyrgdaradili: 'Sigurður', stofnadAf: 'Sigurður', deild: 'sala',
    checklist: [
      { id: 'cl24', texti: 'Undirbúa kynningu á PHEV línum', lokid: false },
      { id: 'cl25', texti: 'Bóka fund með Kristínu', lokid: false },
    ],
    athugasemdir: [],
  },
  {
    id: 'v10', titill: 'Uppfæra samningsskjöl - Marel', lýsing: 'Uppfæra viðauka á flotasamningi eftir akstursmörk breyting', fyrirtaekiId: 'f2', samningurId: 's5', status: 'lokið', forgangur: 'lágt', dagsetning: '2026-02-05', deadline: '2026-02-14', sjálfvirkt: false, abyrgdaradili: 'Anna', stofnadAf: 'Anna', deild: 'flotaleiga',
    checklist: [
      { id: 'cl26', texti: 'Skrifa viðauka', lokid: true, lokadAf: 'Anna' },
      { id: 'cl27', texti: 'Fá undirskrift Marel', lokid: true, lokadAf: 'Anna' },
      { id: 'cl28', texti: 'Hlaða upp í kerfi', lokid: true, lokadAf: 'Anna' },
    ],
    athugasemdir: [],
  },
];

export const activities: Activity[] = [
  { id: 'a1', entityType: 'bill', entityId: 'b5', tegund: 'afhentur', lýsing: 'Bíll afhentur Ístak hf.', dagsetning: '2025-04-01', notandi: 'Anna' },
  { id: 'a2', entityType: 'bill', entityId: 'b5', tegund: 'postur_sendur', lýsing: 'Eftirfylgni email sent til Guðrúnar', dagsetning: '2025-04-04', notandi: 'Kerfið' },
  { id: 'a3', entityType: 'bill', entityId: 'b5', tegund: 'konnun_send', lýsing: 'Ánægjukönnun send til viðskiptavinar', dagsetning: '2025-04-08', notandi: 'Kerfið' },
  { id: 'a4', entityType: 'bill', entityId: 'b5', tegund: 'thjonusta', lýsing: '30.000 km þjónustuskoðun framkvæmd', dagsetning: '2025-09-15', notandi: 'Helgi' },
  { id: 'a5', entityType: 'bill', entityId: 'b12', tegund: 'afhentur', lýsing: 'Bíll afhentur Ístak hf.', dagsetning: '2025-06-15', notandi: 'Anna' },
  { id: 'a6', entityType: 'bill', entityId: 'b12', tegund: 'thjonusta', lýsing: '15.000 km þjónustuskoðun', dagsetning: '2025-11-15', notandi: 'Helgi' },
  { id: 'a7', entityType: 'bill', entityId: 'b25', tegund: 'afhentur', lýsing: 'Sendibíll afhentur Eimskip', dagsetning: '2024-03-01', notandi: 'Kristján' },
  { id: 'a8', entityType: 'bill', entityId: 'b25', tegund: 'thjonusta', lýsing: '40.000 km þjónustuskoðun', dagsetning: '2025-08-25', notandi: 'Helgi' },
  { id: 'a9', entityType: 'samningur', entityId: 's1', tegund: 'samningur_undirritadur', lýsing: 'Samningur undirritaður', dagsetning: '2025-04-01', notandi: 'Anna' },
  { id: 'a10', entityType: 'bill', entityId: 'b19', tegund: 'tjon_skrad', lýsing: 'Tjón skráð - skemmdir á stuðara', dagsetning: '2026-02-16', notandi: 'Helgi' },
];

// Innifalið í Enterprise langtímaleigu
export const innifaliðILeigu = [
  'Bifreiðagjöld',
  'Umsaminn akstur (1.000-1.300 km/mán)',
  'Þjónustuskoðanir',
  'Ábyrgðartrygging',
  'Kaskótrygging',
  'Smurþjónusta',
  'Dekk og dekkjaskipti',
  'Hefðbundið viðhald',
  'Virðisaukaskattur',
];

export const tryggingarPakkar = [
  { nafn: 'Enterprise', sjalfsabyrgd: 250000, framruda: false, folksbilVerð: 0, jeppaVerð: 0, lysing: 'Innifalin' },
  { nafn: 'Plús', sjalfsabyrgd: 150000, framruda: true, framrudaSjalfsabyrgd: '50%', folksbilVerð: 4900, jeppaVerð: 6900, lysing: 'Lækkuð sjálfsábyrgð' },
  { nafn: 'Úrvals', sjalfsabyrgd: 75000, framruda: true, framrudaSjalfsabyrgd: '15%', folksbilVerð: 8900, jeppaVerð: 10900, lysing: 'Lægsta sjálfsábyrgð' },
];

// ============ SJÁLFGEFIN ÁHUGAMÁL / ATHYGLISVERT ============

export const DEFAULT_AHUGAMAL: string[] = [
  'Golf',
  'Hlaup',
  'Fótbolti',
  'Handknattleikur',
  'Útivist',
  'Ferðalög',
  'Sjálfbærni',
  'Rafbílar',
  'Bílar',
  'Tækni',
  'Fjármál',
  'Ráðstefnur',
  'Viðburðir',
  'Fjölskylda',
  'Heilsa og líðan',
  'Listir og menning',
];

// ============ MARKHÓPAR, HERFERÐIR OG EMAIL TEMPLATES ============

export const markhópar: Markhópur[] = [
  { id: 'mh1', nafn: 'Stjórnendur', lysing: 'Framkvæmdastjórar, fjármálastjórar og aðrir æðstu stjórnendur', litur: '#ef4444' },
  { id: 'mh2', nafn: 'Flotastjórar', lysing: 'Tengiliðir sem sjá um bílaflota fyrirtækja', litur: '#3b82f6' },
  { id: 'mh3', nafn: 'Daglegur rekstur', lysing: 'Tengiliðir sem sjá um daglegan rekstur bíla', litur: '#22c55e' },
  { id: 'mh4', nafn: 'Sjálfbærniteymi', lysing: 'Tengiliðir sem hafa áhuga á rafbílum og sjálfbærni', litur: '#8b5cf6' },
];

export const herferðir: Herferð[] = [
  { id: 'h1', nafn: 'Golfmót Enterprise 2026', lysing: 'Árlegt golfmót Enterprise Bílaleigu fyrir helstu viðskiptavini', dagsetning: '2026-06-15', status: 'áætluð', litur: '#22c55e' },
  { id: 'h2', nafn: 'Rafbílavæðing 2026', lysing: 'Herferð til að kynna rafbíla og PHEV valkosti', dagsetning: '2026-03-01', status: 'virk', litur: '#3b82f6' },
  { id: 'h3', nafn: 'Sumarkynning', lysing: 'Sérkjör á langtímaleigu yfir sumarið', dagsetning: '2026-05-01', status: 'áætluð', litur: '#f59e0b' },
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'et1',
    nafn: 'Boðsmiði - Golfmót',
    lysing: 'Boðsmiði fyrir árlegt golfmót Enterprise',
    efni: 'Boð í Golfmót Enterprise Bílaleigu 2026',
    flokkur: 'boðsmiði',
    texti: `Kæri/kær {{nafn}},

Okkur þykir vænt um að bjóða þér í árlegt golfmót Enterprise Bílaleigu sem haldið verður þann 15. júní 2026 í Grafarholtsvelli.

Dagskrá:
• 08:30 – Skráning og morgunverður
• 09:30 – Kynning á nýjum bílalínum
• 10:00 – Mótið hefst (Best ball, 4 manna teymi)
• 15:00 – Hádegisverður og verðlaunaafhending
• 16:30 – Netþing og sýning á rafbílum

Keppnisgjald er innifalið og við sjáum um allan búnað ef þörf er á.

Vinsamlegast staðfestu þátttöku fyrir 1. júní.

Bestu kveðjur,
Enterprise Bílaleiga`,
  },
  {
    id: 'et2',
    nafn: 'Boðsmiði - Viðburður',
    lysing: 'Almenn boðsmiðasniðmát fyrir viðburði',
    efni: 'Boð í viðburð hjá Enterprise Bílaleigu',
    flokkur: 'boðsmiði',
    texti: `Kæri/kær {{nafn}},

Við bjóðum þér velkomna á viðburð okkar sem haldinn verður [dagsetning] á [staðsetning].

[Lýsing á viðburði]

Vinsamlegast staðfestu þátttöku með því að svara þessum tölvupósti.

Bestu kveðjur,
Enterprise Bílaleiga`,
  },
  {
    id: 'et3',
    nafn: 'Kynning - Rafbílar',
    lysing: 'Kynning á nýjum rafbílum og PHEV',
    efni: 'Nýir rafbílar hjá Enterprise – Sérkjör fyrir viðskiptavini',
    flokkur: 'kynning',
    texti: `Kæri/kær {{nafn}},

Við erum spennt að kynna nýjustu viðbætur við bílaflota okkar – fullrafmagns og PHEV bílar sem bjóða upp á umhverfisvæna aksturslausn án þess að fórna þægindum.

Nýjar gerðir í boði:
• VW ID.5 – frá 180.900 kr./mán
• Tesla Model Y Long Range – frá 180.900 kr./mán
• Kia Niro PHEV – frá 130.900 kr./mán
• Kia Sportage PHEV – frá 168.900 kr./mán

Allt innifalið í mánaðarverði – tryggingar, þjónusta, dekk og viðhald.

Hafðu samband við okkur til að fá sérsniðið tilboð.

Bestu kveðjur,
Enterprise Bílaleiga`,
  },
  {
    id: 'et4',
    nafn: 'Eftirfylgni - Samningur',
    lysing: 'Eftirfylgni vegna samnings sem rennur út',
    efni: 'Samningur þinn hjá Enterprise – Endurnýjun',
    flokkur: 'eftirfylgni',
    texti: `Kæri/kær {{nafn}},

Samningur þinn hjá Enterprise Bílaleigu er að renna út á næstunni og við viljum tryggja að þú hafir besta mögulega tilboðið til áframhaldandi samstarfs.

Við bjóðum upp á:
• Sömu eða betri kjör við endurnýjun
• Uppfærslu í nýrri gerð
• Sveigjanlega samningslengd (12-36 mánuðir)

Getum við skipulagt fund til að fara yfir valkostina?

Bestu kveðjur,
Enterprise Bílaleiga`,
  },
  {
    id: 'et5',
    nafn: 'Sumarkynning',
    lysing: 'Sérkjör á sumarleigum',
    efni: 'Sumarkjör hjá Enterprise Bílaleigu',
    flokkur: 'kynning',
    texti: `Kæri/kær {{nafn}},

Sumarið er á næsta leiti og Enterprise Bílaleiga býður sérstök sumarkjör á langtímaleigu!

Sérstakar tilboð:
• 10% afsláttur af mánaðarverði á öllum jepplingum
• Frítt GPS-tæki með öllum nýjum samningum
• Sumardekkjaskipti innifalið

Tilboðið gildir fyrir samninga sem gerðir eru á tímabilinu 1. maí – 30. júní 2026.

Hafðu samband til að fá tilboð!

Bestu kveðjur,
Enterprise Bílaleiga`,
  },
];

export function getAllTengiliðir(): (Tengiliður & { fyrirtaekiId: string; fyrirtaekiNafn: string })[] {
  const allContacts: (Tengiliður & { fyrirtaekiId: string; fyrirtaekiNafn: string })[] = [];
  for (const f of fyrirtaeki) {
    for (const t of f.tengiliðir) {
      allContacts.push({ ...t, fyrirtaekiId: f.id, fyrirtaekiNafn: f.nafn });
    }
  }
  return allContacts;
}

export function getMarkhópur(id: string) {
  return markhópar.find(m => m.id === id);
}

export function getHerferð(id: string) {
  return herferðir.find(h => h.id === id);
}

// ============ HELPER FUNCTIONS ============

export function getFyrirtaeki(id: string) {
  return fyrirtaeki.find(f => f.id === id);
}

export function getSamningarFyrirtaekis(fyrirtaekiId: string) {
  return samningar.filter(s => s.fyrirtaekiId === fyrirtaekiId);
}

export function getBilarFyrirtaekis(fyrirtaekiId: string) {
  return bilar.filter(b => b.fyrirtaekiId === fyrirtaekiId);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('is-IS') + ' kr.';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'virkur': '#22c55e',
    'rennur_ut': '#ea580c',
    'lokid': '#6b7280',
    'uppsagt': '#ef4444',
    'í leigu': '#3b82f6',
    'laus': '#22c55e',
    'í þjónustu': '#f59e0b',
    'uppseldur': '#ef4444',
    'opið': '#3b82f6',
    'í vinnslu': '#f59e0b',
    'bíður svars': '#8b5cf6',
    'bíður viðskiptavinar': '#8b5cf6',
    'lokað': '#6b7280',
    'í gangi': '#3b82f6',
    'nýtt': '#22c55e',
    'lead': '#3b82f6',
    'tilboð sent': '#f59e0b',
    'samningur í vinnslu': '#8b5cf6',
    'lokað unnið': '#22c55e',
    'lokað tapað': '#ef4444',
    'samið': '#22c55e',
    'tapað': '#ef4444',
    'áætluð': '#3b82f6',
    'áminning send': '#f59e0b',
    'seinkað': '#ef4444',
    'lokið': '#22c55e',
  };
  return colors[status] || '#6b7280';
}

export function getStatusBg(status: string): string {
  const color = getStatusColor(status);
  if (status === 'rennur_ut') return color + '28';
  return color + '20';
}

export function getDashboardStats() {
  const virkir = samningar.filter(s => s.status === 'virkur' || s.status === 'rennur_ut');
  const rennurUt = samningar.filter(s => s.status === 'rennur_ut');
  const heildarBilar = bilar.length;
  const iLeigu = bilar.filter(b => b.status === 'í leigu').length;
  const lausir = bilar.filter(b => b.status === 'laus' || b.status === 'uppseldur').length;
  const opinMal = mal.filter(m => m.status !== 'lokað').length;
  const thjonustuBradlega = thjonustuaminningar.filter(t => {
    const d = new Date(t.dagsThjonustu);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0 && t.status !== 'lokið';
  }).length;
  const pipalineVerdmaeti = solutaekifaeri
    .filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið')
    .reduce((sum, s) => sum + s.verdmaeti, 0);

  const manadalegurTekjur = virkir.reduce((sum, s) => sum + s.manadalegurKostnadur, 0);

  return {
    virkirSamningar: virkir.length,
    rennurUtSamningar: rennurUt.length,
    heildarBilar,
    iLeigu,
    lausir,
    opinMal,
    thjonustuBradlega,
    pipalineVerdmaeti,
    heildarFyrirtaeki: fyrirtaeki.length,
    manadalegurTekjur,
  };
}

export function getSamningarSemRennaUt(dagar: number = 30) {
  const now = new Date();
  return samningar.filter(s => {
    if (s.status === 'lokid' || s.status === 'uppsagt') return false;
    const loka = new Date(s.lokadagur);
    const diff = (loka.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= dagar && diff > 0;
  });
}

export function getNaestaThjonustur(dagar: number = 30) {
  const now = new Date();
  return thjonustuaminningar.filter(t => {
    const d = new Date(t.dagsThjonustu);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= dagar && diff > -7 && t.status !== 'lokið';
  });
}

export function getBill(id: string) {
  return bilar.find(b => b.id === id);
}

export function getBillByNumer(numer: string) {
  return bilar.find(b => b.numer.toLowerCase() === numer.toLowerCase());
}

export function searchBilar(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return bilar.filter(b =>
    b.numer.toLowerCase().includes(q) ||
    b.tegund.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getSamningur(id: string) {
  return samningar.find(s => s.id === id);
}

export function getThjonustuFerillBils(billId: string) {
  return thpilaThjonustuFerill.filter(t => t.billId === billId);
}

// Virkt þjónustuverk - bíll sem er núna í þjónustu
export interface VirktThjonustuverk {
  id: string;
  billId: string;
  tegund: 'þjónustuskoðun' | 'dekkjaskipti' | 'smurþjónusta' | 'olíuskipti' | 'hefðbundið viðhald' | 'viðgerð';
  lysing: string;
  stadur: string;
  dagsInni: string;
  aaetladurSkiladagur: string;
  kostnadur?: number;
  km?: number;
  athugasemdir?: string;
  aminningId?: string;
}

export const virktThjonustuverk: VirktThjonustuverk[] = [
  { id: 'vt1', billId: 'b28', tegund: 'hefðbundið viðhald', lysing: 'Regluleg 40.000 km skoðun og olíuskipti', stadur: 'Hekla Verkstæði', dagsInni: '2026-02-20', aaetladurSkiladagur: '2026-02-24', kostnadur: 35000, km: 38900, athugasemdir: 'Einnig athuga hemla', aminningId: 'ta5' },
];

export function getVirktThjonustuverk(billId: string): VirktThjonustuverk | undefined {
  return virktThjonustuverk.find(v => v.billId === billId);
}

// Þjónustuferill - saga yfir þjónustu sem hefur verið framkvæmd
export interface ThjonustuFerillItem {
  id: string;
  billId: string;
  dagsetning: string;
  tegund: 'þjónustuskoðun' | 'dekkjaskipti' | 'smurþjónusta' | 'olíuskipti' | 'hefðbundið viðhald' | 'viðgerð';
  lysing: string;
  stadur: string;
  kostnadur: number;
  km: number;
}

export const thpilaThjonustuFerill: ThjonustuFerillItem[] = [
  { id: 'tf1', billId: 'b5', dagsetning: '2025-09-15', tegund: 'þjónustuskoðun', lysing: 'Regluleg 30.000 km skoðun', stadur: 'Hekla Verkstæði', kostnadur: 0, km: 30200 },
  { id: 'tf2', billId: 'b5', dagsetning: '2025-10-20', tegund: 'dekkjaskipti', lysing: 'Skipt á veturdekk, nagladekk', stadur: 'Dekkjaverkstæðið', kostnadur: 20000, km: 31400 },
  { id: 'tf3', billId: 'b5', dagsetning: '2025-03-10', tegund: 'smurþjónusta', lysing: 'Olíuskipti og smurning', stadur: 'Hekla Verkstæði', kostnadur: 0, km: 24500 },
  { id: 'tf4', billId: 'b12', dagsetning: '2025-11-15', tegund: 'þjónustuskoðun', lysing: 'Regluleg 15.000 km skoðun', stadur: 'Bílaumboðið', kostnadur: 0, km: 15800 },
  { id: 'tf5', billId: 'b12', dagsetning: '2025-10-25', tegund: 'dekkjaskipti', lysing: 'Skipt á veturdekk', stadur: 'Dekkjaverkstæðið', kostnadur: 20000, km: 15200 },
  { id: 'tf6', billId: 'b13', dagsetning: '2025-10-01', tegund: 'þjónustuskoðun', lysing: 'Regluleg 20.000 km skoðun', stadur: 'Bílaumboðið', kostnadur: 0, km: 20100 },
  { id: 'tf7', billId: 'b13', dagsetning: '2025-06-15', tegund: 'smurþjónusta', lysing: 'Olíuskipti', stadur: 'Bílaumboðið', kostnadur: 0, km: 16800 },
  { id: 'tf8', billId: 'b14', dagsetning: '2025-09-01', tegund: 'þjónustuskoðun', lysing: 'Regluleg 15.000 km skoðun', stadur: 'Škoda þjónustan', kostnadur: 0, km: 15200 },
  { id: 'tf9', billId: 'b14', dagsetning: '2025-10-15', tegund: 'dekkjaskipti', lysing: 'Skipt á veturdekk', stadur: 'Dekkjaverkstæðið', kostnadur: 20000, km: 16100 },
  { id: 'tf10', billId: 'b25', dagsetning: '2025-08-25', tegund: 'þjónustuskoðun', lysing: 'Regluleg 40.000 km skoðun', stadur: 'VW þjónustan', kostnadur: 0, km: 40100 },
  { id: 'tf11', billId: 'b25', dagsetning: '2025-10-10', tegund: 'dekkjaskipti', lysing: 'Skipt á veturdekk', stadur: 'Dekkjaverkstæðið', kostnadur: 20000, km: 42300 },
  { id: 'tf12', billId: 'b25', dagsetning: '2025-05-20', tegund: 'hefðbundið viðhald', lysing: 'Bremsubúnaður athugaður og skipt um bremsuklossar', stadur: 'VW þjónustan', kostnadur: 0, km: 35600 },
  { id: 'tf13', billId: 'b18', dagsetning: '2025-09-10', tegund: 'þjónustuskoðun', lysing: 'Regluleg 40.000 km skoðun', stadur: 'Toyota þjónustan', kostnadur: 0, km: 40200 },
  { id: 'tf14', billId: 'b18', dagsetning: '2025-06-01', tegund: 'olíuskipti', lysing: 'Olíuskipti og síur', stadur: 'Toyota þjónustan', kostnadur: 0, km: 36500 },
  { id: 'tf15', billId: 'b4', dagsetning: '2025-10-01', tegund: 'þjónustuskoðun', lysing: 'Regluleg 10.000 km skoðun', stadur: 'Opel þjónustan', kostnadur: 0, km: 10800 },
  { id: 'tf16', billId: 'b23', dagsetning: '2025-12-01', tegund: 'þjónustuskoðun', lysing: 'Regluleg 20.000 km skoðun', stadur: 'VW þjónustan', kostnadur: 0, km: 20100 },
  { id: 'tf17', billId: 'b24', dagsetning: '2025-10-15', tegund: 'þjónustuskoðun', lysing: 'Regluleg 30.000 km skoðun', stadur: 'Tesla þjónustan', kostnadur: 0, km: 30500 },
  { id: 'tf18', billId: 'b26', dagsetning: '2025-09-15', tegund: 'þjónustuskoðun', lysing: 'Regluleg 35.000 km skoðun', stadur: 'Mercedes þjónustan', kostnadur: 0, km: 35200 },
  { id: 'tf19', billId: 'b27', dagsetning: '2025-09-01', tegund: 'þjónustuskoðun', lysing: 'Regluleg 50.000 km skoðun', stadur: 'Ford þjónustan', kostnadur: 0, km: 50100 },
  { id: 'tf20', billId: 'b27', dagsetning: '2025-06-20', tegund: 'viðgerð', lysing: 'Viðgerð á skiptingu', stadur: 'Ford þjónustan', kostnadur: 0, km: 45200 },

  // Samningsskjöl (mock) - til að sýna upload virkni
];

export interface SamningsSkjal {
  id: string;
  samningurId: string;
  nafn: string;
  tegund: 'samningur' | 'viðauki' | 'skilmat' | 'annað';
  dagsett: string;
  staerd: string;
}

export const samningsSkjol: SamningsSkjal[] = [
  { id: 'sk1', samningurId: 's1', nafn: 'Samningur_Istak_HI302.pdf', tegund: 'samningur', dagsett: '2025-04-01', staerd: '245 KB' },
  { id: 'sk2', samningurId: 's2', nafn: 'Samningur_Istak_KSP501.pdf', tegund: 'samningur', dagsett: '2025-06-15', staerd: '312 KB' },
  { id: 'sk3', samningurId: 's3', nafn: 'Samningur_Marel_KC304.pdf', tegund: 'samningur', dagsett: '2025-01-01', staerd: '289 KB' },
  { id: 'sk4', samningurId: 's5', nafn: 'Flotasamningur_Marel.pdf', tegund: 'samningur', dagsett: '2024-06-01', staerd: '456 KB' },
  { id: 'sk5', samningurId: 's5', nafn: 'Vidauki_1_Marel.pdf', tegund: 'viðauki', dagsett: '2024-09-15', staerd: '128 KB' },
  { id: 'sk6', samningurId: 's6', nafn: 'Flotasamningur_LV.pdf', tegund: 'samningur', dagsett: '2024-01-01', staerd: '523 KB' },
  { id: 'sk7', samningurId: 's8', nafn: 'Samningur_Eimskip_SB801.pdf', tegund: 'samningur', dagsett: '2024-03-01', staerd: '398 KB' },
  { id: 'sk8', samningurId: 's10', nafn: 'Samningur_VIS_OC301.pdf', tegund: 'samningur', dagsett: '2025-03-01', staerd: '267 KB' },
];

// ============ NOTENDASTJÓRNUN ============

export type Hlutverk = 'stjornandi' | 'solumaður_langtima' | 'solumaður_flota' | 'thjonustufulltrui' | 'yfirmaður';

export interface Notandi {
  id: string;
  nafn: string;
  netfang: string;
  hlutverk: Hlutverk;
  svid: ('flotaleiga' | 'langtimaleiga')[];
  virkur: boolean;
  sidastaInnskraning: string;
  mynd?: string;
}

export const hlutverkLysingar: Record<Hlutverk, { label: string; lysing: string; color: string }> = {
  stjornandi: { label: 'Stjórnandi', lysing: 'Fullur aðgangur að öllu kerfinu, bæði flota- og langtímaleigu', color: '#ef4444' },
  yfirmaður: { label: 'Yfirmaður', lysing: 'Aðgangur að báðum sviðum, getur breytt stillingum', color: '#f59e0b' },
  solumaður_langtima: { label: 'Sölumaður – Langtímaleiga', lysing: 'Aðgangur eingöngu að langtímaleigu gögnum', color: '#3b82f6' },
  solumaður_flota: { label: 'Sölumaður – Flotaleiga', lysing: 'Aðgangur að bæði flota- og langtímaleigu gögnum', color: '#8b5cf6' },
  thjonustufulltrui: { label: 'Þjónustufulltrúi', lysing: 'Aðgangur að þjónustu, áminningum og bílastöðu', color: '#06b6d4' },
};

export const notendur: Notandi[] = [
  { id: 'n1', nafn: 'Kristján Ólafsson', netfang: 'kristjan@eleiga.is', hlutverk: 'stjornandi', svid: ['flotaleiga', 'langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-20T09:15:00' },
  { id: 'n2', nafn: 'Anna Sigríður', netfang: 'anna@eleiga.is', hlutverk: 'yfirmaður', svid: ['flotaleiga', 'langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-20T08:30:00' },
  { id: 'n3', nafn: 'Helgi Björnsson', netfang: 'helgi@eleiga.is', hlutverk: 'solumaður_langtima', svid: ['langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-19T16:45:00' },
  { id: 'n4', nafn: 'Sigurður Jónsson', netfang: 'sigurdur@eleiga.is', hlutverk: 'solumaður_flota', svid: ['flotaleiga', 'langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-20T10:00:00' },
  { id: 'n5', nafn: 'Guðrún Pétursdóttir', netfang: 'gudrun@eleiga.is', hlutverk: 'thjonustufulltrui', svid: ['langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-18T14:20:00' },
  { id: 'n6', nafn: 'Ólafur Ragnarsson', netfang: 'olafur@eleiga.is', hlutverk: 'solumaður_langtima', svid: ['langtimaleiga'], virkur: false, sidastaInnskraning: '2026-01-15T11:00:00' },
  { id: 'n7', nafn: 'María Helgadóttir', netfang: 'maria@eleiga.is', hlutverk: 'thjonustufulltrui', svid: ['flotaleiga', 'langtimaleiga'], virkur: true, sidastaInnskraning: '2026-02-20T07:50:00' },
];

export function getNotandiByNafn(nafn: string): Notandi | undefined {
  return notendur.find(n => n.nafn.startsWith(nafn) && n.virkur);
}

export function getVirkirNotendur(): Notandi[] {
  return notendur.filter(n => n.virkur);
}

// ============ FYRRVERANDI VIÐSKIPTAVINIR ============

export interface FyrrverandiVidskiptavinur {
  id: string;
  nafn: string;
  kennitala: string;
  sidastiSamningur: string;
  astaeða: string;
  fjoldiBila: number;
  pipiTegund: Fyrirtaeki['pipiTegund'];
}

export const fyrrverandiVidskiptavinir: FyrrverandiVidskiptavinur[] = [
  { id: 'fv1', nafn: 'Össur hf.', kennitala: '560388-2849', sidastiSamningur: '2025-08-31', astaeða: 'Fóru til samkeppnisaðila', fjoldiBila: 8, pipiTegund: 'floti' },
  { id: 'fv2', nafn: 'Icelandair Group', kennitala: '630305-1780', sidastiSamningur: '2025-06-15', astaeða: 'Niðurskurður á kostnaði', fjoldiBila: 15, pipiTegund: 'floti' },
  { id: 'fv3', nafn: 'Brim hf.', kennitala: '450100-3560', sidastiSamningur: '2025-10-01', astaeða: 'Keyptu eigin bíla', fjoldiBila: 4, pipiTegund: 'langtimaleiga' },
  { id: 'fv4', nafn: 'Stefnir hf.', kennitala: '501202-2140', sidastiSamningur: '2025-11-30', astaeða: 'Samningur rann út', fjoldiBila: 3, pipiTegund: 'langtimaleiga' },
];

// ============ SNJÖLL TÆKIFÆRAGREINING ============

export type TaekifaeriFlokkur =
  | 'samningar_renna_ut'
  | 'mal_benda_til_solu'
  | 'fyrirtaeki_an_taekifaera'
  | 'lausir_bilar'
  | 'fyrrverandi_vidskiptavinir';

export interface TaekifaeriTillaga {
  id: string;
  flokkur: TaekifaeriFlokkur;
  fyrirtaekiNafn: string;
  fyrirtaekiId?: string;
  titill: string;
  lysing: string;
  pipiTegund: Fyrirtaeki['pipiTegund'];
  aetladVerdmaeti: number;
  brpiAdgerd: string;
  metadata?: Record<string, string>;
}

export interface TaekifaeriFlokkadar {
  flokkur: TaekifaeriFlokkur;
  label: string;
  color: string;
  icon: string;
  tillogur: TaekifaeriTillaga[];
}

export function findaSolutaekifaeri(): TaekifaeriFlokkadar[] {
  const now = new Date();
  const soFyrirtaekiIds = new Set(solutaekifaeri.map(s => s.fyrirtaekiId));

  // 1. Samningar sem renna út án endurnýjunartækifæris
  const rennurUt: TaekifaeriTillaga[] = [];
  const samningarRennurUt = samningar.filter(s => {
    if (s.status === 'lokid' || s.status === 'uppsagt') return false;
    const loka = new Date(s.lokadagur);
    const diff = (loka.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 60 && diff > -7;
  });
  for (const sam of samningarRennurUt) {
    const f = getFyrirtaeki(sam.fyrirtaekiId);
    if (!f) continue;
    const hasTaekifaeri = solutaekifaeri.some(
      s => s.fyrirtaekiId === sam.fyrirtaekiId &&
        s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið' &&
        s.titill.toLowerCase().includes('endurnýj')
    );
    if (hasTaekifaeri) continue;
    rennurUt.push({
      id: `rt-${sam.id}`,
      flokkur: 'samningar_renna_ut',
      fyrirtaekiNafn: f.nafn,
      fyrirtaekiId: f.id,
      titill: `Endurnýjun – ${sam.bilategund}`,
      lysing: `Samningur ${sam.id} (${sam.bilanumer}) rennur út ${sam.lokadagur}`,
      pipiTegund: f.pipiTegund,
      aetladVerdmaeti: sam.manadalegurKostnadur * 12,
      brpiAdgerd: `Hafa samband við ${f.tengiliðir[0]?.nafn ?? 'tengilið'}`,
      metadata: { samningurId: sam.id, bilanumer: sam.bilanumer },
    });
  }

  // 2. Mál sem benda til sölu
  const malTillogur: TaekifaeriTillaga[] = [];
  const soluMal = mal.filter(m =>
    m.status !== 'lokað' &&
    (m.tegund === 'fyrirspurn' || m.tegund === 'breyting á samningi')
  );
  for (const m of soluMal) {
    const f = getFyrirtaeki(m.fyrirtaekiId);
    if (!f) continue;
    const verdmaeti = m.tegund === 'fyrirspurn' ? 3600000 : 1200000;
    malTillogur.push({
      id: `mt-${m.id}`,
      flokkur: 'mal_benda_til_solu',
      fyrirtaekiNafn: f.nafn,
      fyrirtaekiId: f.id,
      titill: m.titill,
      lysing: m.lýsing,
      pipiTegund: f.pipiTegund,
      aetladVerdmaeti: verdmaeti,
      brpiAdgerd: `Breyta máli í sölutækifæri – ábyrgðaraðili: ${m.abyrgdaraðili}`,
      metadata: { malId: m.id, tegund: m.tegund },
    });
  }

  // 3. Fyrirtæki án tækifæra
  const anTaekifaera: TaekifaeriTillaga[] = [];
  for (const f of fyrirtaeki) {
    if (soFyrirtaekiIds.has(f.id)) continue;
    const virkir = samningar.filter(s => s.fyrirtaekiId === f.id && (s.status === 'virkur' || s.status === 'rennur_ut'));
    if (virkir.length === 0) continue;
    const meðalVerð = virkir.reduce((s, v) => s + v.manadalegurKostnadur, 0) / virkir.length;
    anTaekifaera.push({
      id: `at-${f.id}`,
      flokkur: 'fyrirtaeki_an_taekifaera',
      fyrirtaekiNafn: f.nafn,
      fyrirtaekiId: f.id,
      titill: `${f.nafn} – stækkun eða endurnýjun`,
      lysing: `${virkir.length} virkir samningar, ekkert í sölurásinni`,
      pipiTegund: f.pipiTegund,
      aetladVerdmaeti: Math.round(meðalVerð * 12),
      brpiAdgerd: `Hafa samband og kynna nýja möguleika`,
    });
  }

  // 4. Lausir bílar
  const lausirBilar: TaekifaeriTillaga[] = bilar
    .filter(b => b.status === 'laus')
    .map(b => ({
      id: `lb-${b.id}`,
      flokkur: 'lausir_bilar' as TaekifaeriFlokkur,
      fyrirtaekiNafn: '',
      titill: `${b.tegund} (${b.numer})`,
      lysing: `${b.bilaFlokkur} – ${b.arsgerð} – ${b.ekinkm.toLocaleString('is-IS')} km – frá ${formatCurrency(b.verdFra)}/mán`,
      pipiTegund: 'langtimaleiga' as Fyrirtaeki['pipiTegund'],
      aetladVerdmaeti: b.verdFra * 12,
      brpiAdgerd: `Bjóða viðskiptavinum sem passa við ${b.bilaFlokkur.toLowerCase()}`,
      metadata: { billId: b.id, numer: b.numer },
    }));

  // 5. Fyrrverandi viðskiptavinir
  const fyrrverandi: TaekifaeriTillaga[] = fyrrverandiVidskiptavinir.map(fv => ({
    id: `fv-${fv.id}`,
    flokkur: 'fyrrverandi_vidskiptavinir' as TaekifaeriFlokkur,
    fyrirtaekiNafn: fv.nafn,
    titill: `${fv.nafn} – endurvinna viðskipti`,
    lysing: `Síðasti samningur: ${fv.sidastiSamningur}. Ástæða: ${fv.astaeða}. Áður ${fv.fjoldiBila} bílar.`,
    pipiTegund: fv.pipiTegund,
    aetladVerdmaeti: fv.fjoldiBila * 150000 * 12,
    brpiAdgerd: `Senda kynningartilboð á nýjum kjörum`,
  }));

  const allFlokkar: TaekifaeriFlokkadar[] = [
    {
      flokkur: 'samningar_renna_ut',
      label: 'Samningar sem renna út',
      color: '#ef4444',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      tillogur: rennurUt,
    },
    {
      flokkur: 'mal_benda_til_solu',
      label: 'Mál sem benda til sölu',
      color: '#f59e0b',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      tillogur: malTillogur,
    },
    {
      flokkur: 'fyrirtaeki_an_taekifaera',
      label: 'Fyrirtæki án tækifæra',
      color: '#3b82f6',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      tillogur: anTaekifaera,
    },
    {
      flokkur: 'lausir_bilar',
      label: 'Lausir bílar til úthlutunar',
      color: '#22c55e',
      icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M21 12.75V6.375a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 6.375v6.375',
      tillogur: lausirBilar,
    },
    {
      flokkur: 'fyrrverandi_vidskiptavinir',
      label: 'Fyrrverandi viðskiptavinir',
      color: '#8b5cf6',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      tillogur: fyrrverandi,
    },
  ];

  return allFlokkar.filter(f => f.tillogur.length > 0);
}
