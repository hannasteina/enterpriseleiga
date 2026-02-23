'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  bilar,
  samningar,
  getFyrirtaeki,
  type Bill,
} from '@/lib/enterprise-demo-data';

// ─── Types ──────────────────────────────────────────────────────────────────

type CrmTab = 'yfirlit' | 'afhendingar' | 'eftirfylgni' | 'kannanir';
type EventType = 'sms' | 'email' | 'innri' | 'konnun';
type EventStatus = 'áætlað' | 'sent' | 'svarað' | 'sleppt';

interface WorkflowStep {
  id: string;
  dagarOffset: number;
  tegund: EventType;
  titill: string;
  lysing: string;
  status: EventStatus;
  dagsetning: string;
  spilaboð?: string;
}

interface AfhendingWorkflow {
  id: string;
  billId: string;
  samningurId: string;
  fyrirtaekiId: string;
  tengiliðurNafn: string;
  tengiliðurNetfang: string;
  tengiliðurSimi: string;
  afhentDags: string;
  asetlutSkilaDags: string;
  status: 'virkt' | 'lokið' | 'hlé';
  skref: WorkflowStep[];
}

interface SkilWorkflow {
  id: string;
  billId: string;
  samningurId: string;
  fyrirtaekiId: string;
  tengiliðurNafn: string;
  skilaDags: string;
  status: 'virkt' | 'lokið';
  npsScore?: number;
  skref: WorkflowStep[];
}

interface KonnunSvar {
  id: string;
  tegund: 'nps' | 'csat' | 'afhending';
  score: number;
  maxScore: number;
  athugasemd?: string;
  dagsetning: string;
  fyrirtaekiNafn: string;
  billNumer: string;
  billTegund: string;
  tengiliðurNafn: string;
}

interface SamskiptaLog {
  id: string;
  tegund: EventType;
  titill: string;
  motttakandi: string;
  dagsetning: string;
  sjálfvirkt: boolean;
  billNumer: string;
  fyrirtaekiNafn: string;
}

// ─── Workflow Templates ─────────────────────────────────────────────────────

interface WorkflowTemplate {
  dagarOffset: number;
  tegund: EventType;
  titill: string;
  lysing: string;
  spilaboð: string;
}

const AFHENDING_TEMPLATE: WorkflowTemplate[] = [
  { dagarOffset: 0, tegund: 'sms', titill: 'Velkomin SMS', lysing: 'Velkominskilaboð með helstu upplýsingum', spilaboð: 'Velkomin/n hjá Enterprise Leiga! {{bil}} ({{numer}}) er tilbúinn. Neyðarlína: 555-0000. Góða ferð!' },
  { dagarOffset: 0, tegund: 'email', titill: 'Velkominn tölvupóstur', lysing: 'Ítarlegar upplýsingar, neyðarnúmer og ráðleggingar', spilaboð: 'Góðan daginn {{tengiliður}},\n\nTakk fyrir að velja Enterprise Leiga. {{bil}} ({{numer}}) hefur verið afhent.\n\nNeyðarsími: 555-0000\nÞjónustusími: 555-0001\n\nKveðja,\nEnterprise Leiga' },
  { dagarOffset: 1, tegund: 'konnun', titill: 'Afhendingakönnun', lysing: 'Hvernig gekk afhending?', spilaboð: 'Hvernig myndir þú meta afhendingaferlið? (1-5 stjörnur)' },
  { dagarOffset: 3, tegund: 'sms', titill: 'Vellíðan-check', lysing: 'Er allt í lagi með bílinn?', spilaboð: 'Hæ {{tengiliður}}! Er allt að ganga vel með {{bil}}? Hafðu samband ef þú þarft á einhverju að halda. - Enterprise Leiga' },
  { dagarOffset: -2, tegund: 'email', titill: 'Skilaáminning', lysing: 'Áminning um skil eftir 2 daga', spilaboð: 'Góðan daginn {{tengiliður}},\n\nSkil á {{bil}} ({{numer}}) eru áætluð {{skiladags}}.\n\nMunið að fylla á eldsneyti og fjarlægja persónulega muni.\n\nKveðja,\nEnterprise Leiga' },
  { dagarOffset: -1, tegund: 'sms', titill: 'Lokaskilaáminning', lysing: 'Skil á morgun', spilaboð: 'Enterprise Leiga: Skil á {{bil}} á morgun ({{skiladags}}). Opnunartími: 08:00-17:00. Sjáumst!' },
];

const SKIL_TEMPLATE: WorkflowTemplate[] = [
  { dagarOffset: 0, tegund: 'sms', titill: 'Þakka fyrir', lysing: 'Þakkarskilaboð', spilaboð: 'Takk fyrir viðskiptin {{tengiliður}}! Vonumst til að sjá þig aftur. - Enterprise Leiga' },
  { dagarOffset: 1, tegund: 'konnun', titill: 'NPS könnun', lysing: 'Hversu líklegt er að þú mælir með okkur?', spilaboð: 'Á kvarðanum 0-10, hversu líklegt er að þú mælir með Enterprise Leiga við kunningja?' },
  { dagarOffset: 3, tegund: 'email', titill: 'Google Review beiðni', lysing: 'Beiðni um umsögn (ef NPS >= 8)', spilaboð: 'Góðan daginn {{tengiliður}},\n\nVið þökkum þér fyrir viðskiptin! Ef þú ert ánægð/ur, myndum við meta Google umsögn.\n\nhttps://g.page/enterprise-leiga/review\n\nKveðja,\nEnterprise Leiga' },
  { dagarOffset: 7, tegund: 'email', titill: 'Ráðleggingar og fróðleikur', lysing: 'Nytsamlegt efni um akstur og bíla', spilaboð: 'Góðan daginn {{tengiliður}},\n\nHér eru nokkur ráð sem gætu nýst...' },
  { dagarOffset: 14, tegund: 'email', titill: 'Sértilboð', lysing: '5% afsláttur á næstu leigu', spilaboð: 'Góðan daginn {{tengiliður}},\n\nVið viljum bjóða þér 5% afslátt af næstu leigu hjá okkur.\n\nNotaðu kóðann: VELKOMIN5\n\nKveðja,\nEnterprise Leiga' },
  { dagarOffset: 30, tegund: 'sms', titill: 'Endurtenging', lysing: 'Saknar þú bílsins?', spilaboð: 'Hæ {{tengiliður}}! Ertu að hugsa um nýja leigu? Við erum hér til að hjálpa. Kveðja Enterprise Leiga' },
  { dagarOffset: 90, tegund: 'email', titill: 'Win-back herferð', lysing: 'Sérstakt tilboð til að vinna viðskiptavin til baka', spilaboð: 'Góðan daginn {{tengiliður}},\n\nVið saknum þín! Hér er 10% afsláttur á næstu leigu.\n\nKóði: SAKNA10\n\nKveðja,\nEnterprise Leiga' },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string; icon: string }> = {
  sms: { label: 'SMS', color: '#22c55e', bgColor: 'bg-green-500/15', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  email: { label: 'Tölvupóstur', color: '#3b82f6', bgColor: 'bg-blue-500/15', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  innri: { label: 'Innri tilkynning', color: '#f59e0b', bgColor: 'bg-amber-500/15', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  konnun: { label: 'Könnun', color: '#a855f7', bgColor: 'bg-purple-500/15', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string }> = {
  'áætlað': { label: 'Áætlað', color: 'text-white/50', bg: 'bg-white/5' },
  'sent': { label: 'Sent', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'svarað': { label: 'Svarað', color: 'text-green-400', bg: 'bg-green-500/10' },
  'sleppt': { label: 'Sleppt', color: 'text-white/30', bg: 'bg-white/5' },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysSince(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string): number {
  return -daysSince(dateStr);
}

function generateWorkflowSteps(
  template: WorkflowTemplate[],
  startDate: string,
  endDate: string,
  today: string,
): WorkflowStep[] {
  return template.map((t, i) => {
    const isRelativeToEnd = t.dagarOffset < 0;
    const actualDate = isRelativeToEnd
      ? addDays(endDate, t.dagarOffset)
      : addDays(startDate, t.dagarOffset);

    const isPast = actualDate <= today;
    let status: EventStatus = 'áætlað';
    if (isPast) {
      status = t.tegund === 'konnun' ? 'svarað' : 'sent';
    }

    return {
      id: `ws-${Date.now()}-${i}`,
      dagarOffset: t.dagarOffset,
      tegund: t.tegund,
      titill: t.titill,
      lysing: t.lysing,
      status,
      dagsetning: actualDate,
      spilaboð: t.spilaboð,
    };
  });
}

function getNpsCategory(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Stuðningsmaður', color: '#22c55e' };
  if (score >= 7) return { label: 'Hlutlaus', color: '#f59e0b' };
  return { label: 'Gagnrýnandi', color: '#ef4444' };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const DEMO_AFHENDINGAR: AfhendingWorkflow[] = [
  {
    id: 'aw1',
    billId: 'b5',
    samningurId: 's1',
    fyrirtaekiId: 'f1',
    tengiliðurNafn: 'Jón Magnússon',
    tengiliðurNetfang: 'jon@istak.is',
    tengiliðurSimi: '555-1235',
    afhentDags: '2026-02-18',
    asetlutSkilaDags: '2026-03-31',
    status: 'virkt',
    skref: [
      { id: 'as1', dagarOffset: 0, tegund: 'sms', titill: 'Velkomin SMS', lysing: 'Velkominskilaboð send', status: 'sent', dagsetning: '2026-02-18' },
      { id: 'as2', dagarOffset: 0, tegund: 'email', titill: 'Velkominn tölvupóstur', lysing: 'Ítarlegar upplýsingar sendar', status: 'sent', dagsetning: '2026-02-18' },
      { id: 'as3', dagarOffset: 1, tegund: 'konnun', titill: 'Afhendingakönnun', lysing: 'Hvernig gekk afhending?', status: 'svarað', dagsetning: '2026-02-19' },
      { id: 'as4', dagarOffset: 3, tegund: 'sms', titill: 'Vellíðan-check', lysing: 'Er allt í lagi?', status: 'sent', dagsetning: '2026-02-21' },
      { id: 'as5', dagarOffset: -2, tegund: 'email', titill: 'Skilaáminning', lysing: 'Áminning um skil', status: 'áætlað', dagsetning: '2026-03-29' },
      { id: 'as6', dagarOffset: -1, tegund: 'sms', titill: 'Lokaskilaáminning', lysing: 'Skil á morgun', status: 'áætlað', dagsetning: '2026-03-30' },
    ],
  },
  {
    id: 'aw2',
    billId: 'b12',
    samningurId: 's2',
    fyrirtaekiId: 'f1',
    tengiliðurNafn: 'Guðrún Helga',
    tengiliðurNetfang: 'gudrun@istak.is',
    tengiliðurSimi: '555-1234',
    afhentDags: '2026-02-20',
    asetlutSkilaDags: '2026-06-14',
    status: 'virkt',
    skref: [
      { id: 'as7', dagarOffset: 0, tegund: 'sms', titill: 'Velkomin SMS', lysing: 'Velkominskilaboð send', status: 'sent', dagsetning: '2026-02-20' },
      { id: 'as8', dagarOffset: 0, tegund: 'email', titill: 'Velkominn tölvupóstur', lysing: 'Ítarlegar upplýsingar sendar', status: 'sent', dagsetning: '2026-02-20' },
      { id: 'as9', dagarOffset: 1, tegund: 'konnun', titill: 'Afhendingakönnun', lysing: 'Hvernig gekk afhending?', status: 'sent', dagsetning: '2026-02-21' },
      { id: 'as10', dagarOffset: 3, tegund: 'sms', titill: 'Vellíðan-check', lysing: 'Er allt í lagi?', status: 'áætlað', dagsetning: '2026-02-23' },
      { id: 'as11', dagarOffset: -2, tegund: 'email', titill: 'Skilaáminning', lysing: 'Áminning um skil', status: 'áætlað', dagsetning: '2026-06-12' },
      { id: 'as12', dagarOffset: -1, tegund: 'sms', titill: 'Lokaskilaáminning', lysing: 'Skil á morgun', status: 'áætlað', dagsetning: '2026-06-13' },
    ],
  },
];

const DEMO_SKIL: SkilWorkflow[] = [
  {
    id: 'sw1',
    billId: 'b19',
    samningurId: 's16',
    fyrirtaekiId: 'f8',
    tengiliðurNafn: 'Hrafn Sigurðsson',
    skilaDags: '2026-02-15',
    status: 'virkt',
    npsScore: 9,
    skref: [
      { id: 'ss1', dagarOffset: 0, tegund: 'sms', titill: 'Þakka fyrir', lysing: 'Þakkarskilaboð send', status: 'sent', dagsetning: '2026-02-15' },
      { id: 'ss2', dagarOffset: 1, tegund: 'konnun', titill: 'NPS könnun', lysing: 'NPS skor: 9/10', status: 'svarað', dagsetning: '2026-02-16' },
      { id: 'ss3', dagarOffset: 3, tegund: 'email', titill: 'Google Review beiðni', lysing: 'Beiðni um umsögn send', status: 'sent', dagsetning: '2026-02-18' },
      { id: 'ss4', dagarOffset: 7, tegund: 'email', titill: 'Ráðleggingar', lysing: 'Nytsamlegt efni sent', status: 'sent', dagsetning: '2026-02-22' },
      { id: 'ss5', dagarOffset: 14, tegund: 'email', titill: 'Sértilboð', lysing: '5% afsláttur', status: 'áætlað', dagsetning: '2026-03-01' },
      { id: 'ss6', dagarOffset: 30, tegund: 'sms', titill: 'Endurtenging', lysing: 'Re-engagement', status: 'áætlað', dagsetning: '2026-03-17' },
      { id: 'ss7', dagarOffset: 90, tegund: 'email', titill: 'Win-back', lysing: 'Win-back herferð', status: 'áætlað', dagsetning: '2026-05-16' },
    ],
  },
  {
    id: 'sw2',
    billId: 'b4',
    samningurId: 's10',
    fyrirtaekiId: 'f7',
    tengiliðurNafn: 'Þórdís Björk',
    skilaDags: '2026-02-20',
    status: 'virkt',
    npsScore: 7,
    skref: [
      { id: 'ss8', dagarOffset: 0, tegund: 'sms', titill: 'Þakka fyrir', lysing: 'Þakkarskilaboð', status: 'sent', dagsetning: '2026-02-20' },
      { id: 'ss9', dagarOffset: 1, tegund: 'konnun', titill: 'NPS könnun', lysing: 'NPS skor: 7/10', status: 'svarað', dagsetning: '2026-02-21' },
      { id: 'ss10', dagarOffset: 3, tegund: 'email', titill: 'Google Review beiðni', lysing: 'Beiðni um umsögn', status: 'áætlað', dagsetning: '2026-02-23' },
      { id: 'ss11', dagarOffset: 7, tegund: 'email', titill: 'Ráðleggingar', lysing: 'Fróðleikur', status: 'áætlað', dagsetning: '2026-02-27' },
      { id: 'ss12', dagarOffset: 14, tegund: 'email', titill: 'Sértilboð', lysing: '5% afsláttur', status: 'áætlað', dagsetning: '2026-03-06' },
      { id: 'ss13', dagarOffset: 30, tegund: 'sms', titill: 'Endurtenging', lysing: 'Re-engagement', status: 'áætlað', dagsetning: '2026-03-22' },
      { id: 'ss14', dagarOffset: 90, tegund: 'email', titill: 'Win-back', lysing: 'Win-back herferð', status: 'áætlað', dagsetning: '2026-05-21' },
    ],
  },
];

const DEMO_KANNANIR: KonnunSvar[] = [
  { id: 'k1', tegund: 'afhending', score: 5, maxScore: 5, dagsetning: '2026-02-19', fyrirtaekiNafn: 'Ístak hf.', billNumer: 'HI-302', billTegund: 'Hyundai I30 Wagon', tengiliðurNafn: 'Jón Magnússon', athugasemd: 'Mjög slétt og vel skipulögð afhending!' },
  { id: 'k2', tegund: 'nps', score: 9, maxScore: 10, dagsetning: '2026-02-16', fyrirtaekiNafn: 'Reykjavík Excursions', billNumer: 'JC-508', billTegund: 'Jeep Compass PHEV', tengiliðurNafn: 'Hrafn Sigurðsson', athugasemd: 'Frábær þjónusta. Mæli eindregið með.' },
  { id: 'k3', tegund: 'nps', score: 7, maxScore: 10, dagsetning: '2026-02-21', fyrirtaekiNafn: 'VÍS Tryggingar', billNumer: 'OC-301', billTegund: 'Opel Corsa', tengiliðurNafn: 'Þórdís Björk', athugasemd: 'Gott en bíllinn var ekki alveg hreinn við afhendingu.' },
  { id: 'k4', tegund: 'nps', score: 10, maxScore: 10, dagsetning: '2026-02-10', fyrirtaekiNafn: 'Marel hf.', billNumer: 'KC-304', billTegund: 'Kia Ceed Station', tengiliðurNafn: 'Anna Björk', athugasemd: 'Ekkert nema lof! Besti bílaleiguþjónusti á Íslandi.' },
  { id: 'k5', tegund: 'afhending', score: 4, maxScore: 5, dagsetning: '2026-02-05', fyrirtaekiNafn: 'Landsvirkjun', billNumer: 'SK-503', billTegund: 'Škoda Kodiaq', tengiliðurNafn: 'Björn Þór' },
  { id: 'k6', tegund: 'nps', score: 6, maxScore: 10, dagsetning: '2026-01-28', fyrirtaekiNafn: 'Eimskip hf.', billNumer: 'SB-801', billTegund: 'VW Transporter', tengiliðurNafn: 'Ólafur Karl', athugasemd: 'Verðið gæti verið lægra.' },
  { id: 'k7', tegund: 'nps', score: 9, maxScore: 10, dagsetning: '2026-01-20', fyrirtaekiNafn: 'Síminn hf.', billNumer: 'KP-101', billTegund: 'Kia Picanto', tengiliðurNafn: 'Kristín Sól' },
  { id: 'k8', tegund: 'nps', score: 8, maxScore: 10, dagsetning: '2026-01-15', fyrirtaekiNafn: 'Origo hf.', billNumer: 'KS-401', billTegund: 'Kia Stonic', tengiliðurNafn: 'Margrét Dóra', athugasemd: 'Góð þjónusta, skil gengu vel.' },
];

const DEMO_SAMSKIPTI: SamskiptaLog[] = [
  { id: 'sl1', tegund: 'sms', titill: 'Velkomin SMS', motttakandi: 'Guðrún Helga (555-1234)', dagsetning: '2026-02-20', sjálfvirkt: true, billNumer: 'KSP-501', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl2', tegund: 'email', titill: 'Velkominn tölvupóstur', motttakandi: 'gudrun@istak.is', dagsetning: '2026-02-20', sjálfvirkt: true, billNumer: 'KSP-501', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl3', tegund: 'konnun', titill: 'Afhendingakönnun', motttakandi: 'gudrun@istak.is', dagsetning: '2026-02-21', sjálfvirkt: true, billNumer: 'KSP-501', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl4', tegund: 'sms', titill: 'Vellíðan-check', motttakandi: 'Jón Magnússon (555-1235)', dagsetning: '2026-02-21', sjálfvirkt: true, billNumer: 'HI-302', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl5', tegund: 'sms', titill: 'Þakka fyrir', motttakandi: 'Þórdís Björk (555-7890)', dagsetning: '2026-02-20', sjálfvirkt: true, billNumer: 'OC-301', fyrirtaekiNafn: 'VÍS Tryggingar' },
  { id: 'sl6', tegund: 'konnun', titill: 'NPS könnun', motttakandi: 'thordis@vis.is', dagsetning: '2026-02-21', sjálfvirkt: true, billNumer: 'OC-301', fyrirtaekiNafn: 'VÍS Tryggingar' },
  { id: 'sl7', tegund: 'email', titill: 'Google Review beiðni', motttakandi: 'hrafn@re.is', dagsetning: '2026-02-18', sjálfvirkt: true, billNumer: 'JC-508', fyrirtaekiNafn: 'Reykjavík Excursions' },
  { id: 'sl8', tegund: 'email', titill: 'Ráðleggingar og fróðleikur', motttakandi: 'hrafn@re.is', dagsetning: '2026-02-22', sjálfvirkt: true, billNumer: 'JC-508', fyrirtaekiNafn: 'Reykjavík Excursions' },
  { id: 'sl9', tegund: 'sms', titill: 'Velkomin SMS', motttakandi: 'Jón Magnússon (555-1235)', dagsetning: '2026-02-18', sjálfvirkt: true, billNumer: 'HI-302', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl10', tegund: 'email', titill: 'Velkominn tölvupóstur', motttakandi: 'jon@istak.is', dagsetning: '2026-02-18', sjálfvirkt: true, billNumer: 'HI-302', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl11', tegund: 'konnun', titill: 'Afhendingakönnun', motttakandi: 'jon@istak.is', dagsetning: '2026-02-19', sjálfvirkt: true, billNumer: 'HI-302', fyrirtaekiNafn: 'Ístak hf.' },
  { id: 'sl12', tegund: 'sms', titill: 'Þakka fyrir', motttakandi: 'Hrafn Sigurðsson (555-8901)', dagsetning: '2026-02-15', sjálfvirkt: true, billNumer: 'JC-508', fyrirtaekiNafn: 'Reykjavík Excursions' },
  { id: 'sl13', tegund: 'konnun', titill: 'NPS könnun', motttakandi: 'hrafn@re.is', dagsetning: '2026-02-16', sjálfvirkt: true, billNumer: 'JC-508', fyrirtaekiNafn: 'Reykjavík Excursions' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ThjonustaPage() {
  const [activeTab, setActiveTab] = useState<CrmTab>('yfirlit');
  const [afhendingar, setAfhendingar] = useState<AfhendingWorkflow[]>(DEMO_AFHENDINGAR);
  const [skil, setSkil] = useState<SkilWorkflow[]>(DEMO_SKIL);
  const [kannanir, setKannanir] = useState<KonnunSvar[]>(DEMO_KANNANIR);
  const [samskipti, setSamskipti] = useState<SamskiptaLog[]>(DEMO_SAMSKIPTI);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [showAfhendingModal, setShowAfhendingModal] = useState(false);
  const [showSkilModal, setShowSkilModal] = useState(false);
  const [showFerliStillingar, setShowFerliStillingar] = useState(false);
  const [showKonnunDetail, setShowKonnunDetail] = useState<KonnunSvar | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const bilarInRental = useMemo(() => {
    return bilar.filter(b =>
      b.status === 'í leigu' &&
      b.fyrirtaekiId &&
      !afhendingar.some(a => a.billId === b.id && a.status === 'virkt')
    );
  }, [afhendingar]);

  const npsScores = useMemo(() => {
    const nps = kannanir.filter(k => k.tegund === 'nps');
    if (nps.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    const promoters = nps.filter(k => k.score >= 9).length;
    const passives = nps.filter(k => k.score >= 7 && k.score <= 8).length;
    const detractors = nps.filter(k => k.score <= 6).length;
    const score = Math.round(((promoters - detractors) / nps.length) * 100);
    return { score, promoters, passives, detractors, total: nps.length };
  }, [kannanir]);

  const stats = useMemo(() => ({
    virkAfhendingar: afhendingar.filter(a => a.status === 'virkt').length,
    virkSkil: skil.filter(s => s.status === 'virkt').length,
    sendtIDag: samskipti.filter(s => s.dagsetning === today).length,
    svarodKannanir: kannanir.filter(k => k.tegund === 'nps').length,
  }), [afhendingar, skil, samskipti, kannanir]);

  function handleVirkjaAfhendingu(billId: string) {
    const bill = bilar.find(b => b.id === billId);
    if (!bill || !bill.fyrirtaekiId) return;
    const company = getFyrirtaeki(bill.fyrirtaekiId);
    if (!company) return;
    const samningur = samningar.find(s => s.bilanumer === bill.numer && s.status === 'virkur');
    const tengilidur = company.tengiliðir.find(t => t.aðaltengiliður) ?? company.tengiliðir[0];
    if (!tengilidur) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const returnDate = samningur?.lokadagur ?? addDays(todayStr, 30);

    const newWorkflow: AfhendingWorkflow = {
      id: `aw-${Date.now()}`,
      billId,
      samningurId: samningur?.id ?? '',
      fyrirtaekiId: bill.fyrirtaekiId,
      tengiliðurNafn: tengilidur.nafn,
      tengiliðurNetfang: tengilidur.netfang,
      tengiliðurSimi: tengilidur.simi,
      afhentDags: todayStr,
      asetlutSkilaDags: returnDate,
      status: 'virkt',
      skref: generateWorkflowSteps(AFHENDING_TEMPLATE, todayStr, returnDate, todayStr),
    };

    setAfhendingar(prev => [newWorkflow, ...prev]);

    const newLogs: SamskiptaLog[] = newWorkflow.skref
      .filter(s => s.status === 'sent' || s.status === 'svarað')
      .map((s, i) => ({
        id: `sl-${Date.now()}-${i}`,
        tegund: s.tegund,
        titill: s.titill,
        motttakandi: s.tegund === 'sms' ? `${tengilidur.nafn} (${tengilidur.simi})` : tengilidur.netfang,
        dagsetning: s.dagsetning,
        sjálfvirkt: true,
        billNumer: bill.numer,
        fyrirtaekiNafn: company.nafn,
      }));
    setSamskipti(prev => [...newLogs, ...prev]);

    setShowAfhendingModal(false);
    showToast(`Afhendingarferli virkjað fyrir ${bill.tegund} (${bill.numer})`);
  }

  function handleSkraSkilBils(billId: string) {
    const bill = bilar.find(b => b.id === billId);
    if (!bill || !bill.fyrirtaekiId) return;
    const company = getFyrirtaeki(bill.fyrirtaekiId);
    if (!company) return;
    const tengilidur = company.tengiliðir.find(t => t.aðaltengiliður) ?? company.tengiliðir[0];
    if (!tengilidur) return;
    const samningur = samningar.find(s => s.bilanumer === bill.numer);

    const todayStr = new Date().toISOString().split('T')[0];
    const existingAf = afhendingar.find(a => a.billId === billId && a.status === 'virkt');
    if (existingAf) {
      setAfhendingar(prev => prev.map(a => a.id === existingAf.id ? { ...a, status: 'lokið' as const } : a));
    }

    const newSkilWf: SkilWorkflow = {
      id: `sw-${Date.now()}`,
      billId,
      samningurId: samningur?.id ?? '',
      fyrirtaekiId: bill.fyrirtaekiId,
      tengiliðurNafn: tengilidur.nafn,
      skilaDags: todayStr,
      status: 'virkt',
      skref: generateWorkflowSteps(SKIL_TEMPLATE, todayStr, todayStr, todayStr),
    };

    setSkil(prev => [newSkilWf, ...prev]);

    const newLogs: SamskiptaLog[] = newSkilWf.skref
      .filter(s => s.status === 'sent' || s.status === 'svarað')
      .map((s, i) => ({
        id: `sl-${Date.now()}-${i}`,
        tegund: s.tegund,
        titill: s.titill,
        motttakandi: s.tegund === 'sms' ? `${tengilidur.nafn} (${tengilidur.simi})` : tengilidur.netfang,
        dagsetning: s.dagsetning,
        sjálfvirkt: true,
        billNumer: bill.numer,
        fyrirtaekiNafn: company.nafn,
      }));
    setSamskipti(prev => [...newLogs, ...prev]);

    setShowSkilModal(false);
    showToast(`Skilaferli virkjað fyrir ${bill.tegund} (${bill.numer})`);
  }

  function handleNpsSvar(skilId: string, score: number, comment: string) {
    setSkil(prev => prev.map(s => {
      if (s.id !== skilId) return s;
      return {
        ...s,
        npsScore: score,
        skref: s.skref.map(sk => sk.tegund === 'konnun' && sk.titill.includes('NPS')
          ? { ...sk, status: 'svarað' as const, lysing: `NPS skor: ${score}/10` }
          : sk
        ),
      };
    }));

    const skilWf = skil.find(s => s.id === skilId);
    if (skilWf) {
      const bill = bilar.find(b => b.id === skilWf.billId);
      const company = skilWf.fyrirtaekiId ? getFyrirtaeki(skilWf.fyrirtaekiId) : null;
      const newKonnun: KonnunSvar = {
        id: `k-${Date.now()}`,
        tegund: 'nps',
        score,
        maxScore: 10,
        athugasemd: comment || undefined,
        dagsetning: today,
        fyrirtaekiNafn: company?.nafn ?? '',
        billNumer: bill?.numer ?? '',
        billTegund: bill?.tegund ?? '',
        tengiliðurNafn: skilWf.tengiliðurNafn,
      };
      setKannanir(prev => [newKonnun, ...prev]);
    }
    showToast(`NPS skor ${score}/10 skráð`);
  }

  const tabs: { value: CrmTab; label: string; icon: string }[] = [
    { value: 'yfirlit', label: 'Stjórnborð', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { value: 'afhendingar', label: 'Afhendingar', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { value: 'eftirfylgni', label: 'Eftirfylgni & Skil', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { value: 'kannanir', label: 'Kannanir & NPS', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Viðskiptatengsl & Sjálfvirk ferli</h1>
          <p className="text-sm text-white/40 mt-1">CRM sjálfvirkni — afhendingar, eftirfylgni, kannanir og samskipti</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFerliStillingar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium border border-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ferli stillingar
          </button>
          <button
            onClick={() => setShowSkilModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors text-sm font-medium border border-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Bíll móttekinn
          </button>
          <button
            onClick={() => setShowAfhendingModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Virkja afhendingarferli
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="NPS skor" value={`${npsScores.score > 0 ? '+' : ''}${npsScores.score}`} color={npsScores.score >= 50 ? '#22c55e' : npsScores.score >= 0 ? '#f59e0b' : '#ef4444'} subtitle={`${npsScores.total ?? 0} svör`} />
        <KpiCard label="Virk afhendingarferli" value={stats.virkAfhendingar.toString()} color="#3b82f6" subtitle="í gangi" />
        <KpiCard label="Virk skilaferli" value={stats.virkSkil.toString()} color="#a855f7" subtitle="eftirfylgni" />
        <KpiCard label="Samskipti í dag" value={stats.sendtIDag.toString()} color="#22c55e" subtitle="sjálfvirk skilaboð" />
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl border border-white/5 overflow-hidden bg-[#161822]">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.value
                ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'yfirlit' && (
        <YfirlitTab
          afhendingar={afhendingar}
          skil={skil}
          kannanir={kannanir}
          samskipti={samskipti}
          npsScores={npsScores}
          onActivateAfhending={() => setShowAfhendingModal(true)}
          onActivateSkil={() => setShowSkilModal(true)}
        />
      )}

      {activeTab === 'afhendingar' && (
        <AfhendingarTab
          afhendingar={afhendingar}
          bilarInRental={bilarInRental}
          expandedWorkflow={expandedWorkflow}
          onToggleExpand={(id) => setExpandedWorkflow(expandedWorkflow === id ? null : id)}
          onActivate={() => setShowAfhendingModal(true)}
          onSkraSkilBils={handleSkraSkilBils}
        />
      )}

      {activeTab === 'eftirfylgni' && (
        <EftirfylgniTab
          skil={skil}
          expandedWorkflow={expandedWorkflow}
          onToggleExpand={(id) => setExpandedWorkflow(expandedWorkflow === id ? null : id)}
          onNpsSvar={handleNpsSvar}
          onActivate={() => setShowSkilModal(true)}
        />
      )}

      {activeTab === 'kannanir' && (
        <KannanirTab
          kannanir={kannanir}
          npsScores={npsScores}
          onShowDetail={setShowKonnunDetail}
        />
      )}

      {/* Modals */}
      {showAfhendingModal && (
        <VirkjaAfhendingModal
          bilar={bilarInRental}
          onClose={() => setShowAfhendingModal(false)}
          onActivate={handleVirkjaAfhendingu}
        />
      )}

      {showSkilModal && (
        <SkraSkilModal
          afhendingar={afhendingar.filter(a => a.status === 'virkt')}
          onClose={() => setShowSkilModal(false)}
          onSkil={handleSkraSkilBils}
        />
      )}

      {showFerliStillingar && (
        <FerliStillingarModal
          onClose={() => setShowFerliStillingar(false)}
        />
      )}

      {showKonnunDetail && (
        <KonnunDetailModal
          konnun={showKonnunDetail}
          onClose={() => setShowKonnunDetail(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1d2e] border border-white/10 text-white text-sm px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, subtitle }: { label: string; value: string; color: string; subtitle: string }) {
  return (
    <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
      <div className="text-xs font-medium text-white/40 mb-2">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-white/30 mt-1">{subtitle}</div>
    </div>
  );
}

// ─── Yfirlit (Dashboard) Tab ────────────────────────────────────────────────

function YfirlitTab({
  afhendingar, skil, kannanir, samskipti, npsScores,
  onActivateAfhending, onActivateSkil,
}: {
  afhendingar: AfhendingWorkflow[];
  skil: SkilWorkflow[];
  kannanir: KonnunSvar[];
  samskipti: SamskiptaLog[];
  npsScores: { score: number; promoters: number; passives: number; detractors: number; total?: number };
  onActivateAfhending: () => void;
  onActivateSkil: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* NPS Overview */}
        <div className="bg-[#161822] rounded-xl border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">NPS dreifing</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className={`text-4xl font-bold ${npsScores.score >= 50 ? 'text-green-400' : npsScores.score >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {npsScores.score > 0 ? '+' : ''}{npsScores.score}
              </div>
              <div className="text-xs text-white/40 mt-1">NPS skor</div>
            </div>
            <div className="flex-1">
              <div className="flex h-6 rounded-full overflow-hidden bg-white/5">
                {npsScores.total && npsScores.total > 0 && (
                  <>
                    <div className="bg-green-500/70 transition-all" style={{ width: `${(npsScores.promoters / npsScores.total) * 100}%` }} />
                    <div className="bg-amber-500/70 transition-all" style={{ width: `${(npsScores.passives / npsScores.total) * 100}%` }} />
                    <div className="bg-red-500/70 transition-all" style={{ width: `${(npsScores.detractors / npsScores.total) * 100}%` }} />
                  </>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-green-400">Stuðningsmenn: {npsScores.promoters}</span>
                <span className="text-amber-400">Hlutlausir: {npsScores.passives}</span>
                <span className="text-red-400">Gagnrýnendur: {npsScores.detractors}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Workflows Summary */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Virk ferli</h3>
            <span className="text-xs text-white/30">{afhendingar.filter(a => a.status === 'virkt').length + skil.filter(s => s.status === 'virkt').length} í gangi</span>
          </div>
          <div className="divide-y divide-white/5">
            {afhendingar.filter(a => a.status === 'virkt').map(a => {
              const bill = bilar.find(b => b.id === a.billId);
              const company = a.fyrirtaekiId ? getFyrirtaeki(a.fyrirtaekiId) : null;
              const completedSteps = a.skref.filter(s => s.status === 'sent' || s.status === 'svarað').length;
              return (
                <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{bill?.tegund}</span>
                      <span className="text-xs text-white/30">{bill?.numer}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Afhending</span>
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{company?.nafn} • {a.tengiliðurNafn}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/50">{completedSteps}/{a.skref.length} skref</div>
                    <div className="w-20 h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completedSteps / a.skref.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {skil.filter(s => s.status === 'virkt').map(s => {
              const bill = bilar.find(b => b.id === s.billId);
              const company = s.fyrirtaekiId ? getFyrirtaeki(s.fyrirtaekiId) : null;
              const completedSteps = s.skref.filter(sk => sk.status === 'sent' || sk.status === 'svarað').length;
              return (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{bill?.tegund}</span>
                      <span className="text-xs text-white/30">{bill?.numer}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">Eftirfylgni</span>
                      {s.npsScore !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          s.npsScore >= 9 ? 'bg-green-500/10 text-green-400' : s.npsScore >= 7 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>NPS: {s.npsScore}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{company?.nafn} • {s.tengiliðurNafn}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/50">{completedSteps}/{s.skref.length} skref</div>
                    <div className="w-20 h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(completedSteps / s.skref.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {afhendingar.filter(a => a.status === 'virkt').length + skil.filter(s => s.status === 'virkt').length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-white/30">Engin virk ferli</div>
            )}
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Nýleg samskipti</h3>
          </div>
          <div className="divide-y divide-white/5">
            {samskipti.slice(0, 8).map(s => {
              const cfg = EVENT_TYPE_CONFIG[s.tegund];
              return (
                <div key={s.id} className="px-6 py-3 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70">{s.titill}</div>
                    <div className="text-[11px] text-white/30">{s.motttakandi} • {s.billNumer}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-white/30">{formatDate(s.dagsetning)}</div>
                    {s.sjálfvirkt && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">sjálfvirkt</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-1">Flýtiaðgerðir</h3>
          <button
            onClick={onActivateAfhending}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/[0.05] border border-blue-500/15 hover:bg-blue-500/10 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-300">Virkja afhendingarferli</div>
              <div className="text-[11px] text-white/40">Bíll afhendur — sjálfvirkt ferli hefst</div>
            </div>
          </button>
          <button
            onClick={onActivateSkil}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 hover:bg-emerald-500/10 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-emerald-300">Bíll móttekinn</div>
              <div className="text-[11px] text-white/40">Skrá skil — CRM eftirfylgni hefst</div>
            </div>
          </button>
        </div>

        {/* Recent Surveys */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Nýlegar kannanir</h3>
          </div>
          <div className="p-4 space-y-2">
            {kannanir.slice(0, 5).map(k => {
              const npsInfo = k.tegund === 'nps' ? getNpsCategory(k.score) : null;
              return (
                <div key={k.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60 font-medium">{k.tengiliðurNafn}</span>
                    <span className="text-lg font-bold" style={{ color: npsInfo?.color ?? '#3b82f6' }}>
                      {k.score}/{k.maxScore}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/30">
                    {k.fyrirtaekiNafn} • {k.billNumer}
                    {npsInfo && <span className="ml-2" style={{ color: npsInfo.color }}>{npsInfo.label}</span>}
                  </div>
                  {k.athugasemd && (
                    <p className="text-[11px] text-white/40 mt-1.5 italic">&quot;{k.athugasemd}&quot;</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Process Info */}
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Sjálfvirk ferli</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-500/[0.03] border border-blue-500/10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-blue-300">Afhendingarferli</span>
              </div>
              <div className="text-[11px] text-white/40 leading-relaxed">
                {AFHENDING_TEMPLATE.length} sjálfvirk skref — frá velkomu til lokaskilaáminningu.
                SMS, tölvupóstar og könnun send sjálfkrafa.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/[0.03] border border-purple-500/10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-purple-300">Skilaferli & CRM</span>
              </div>
              <div className="text-[11px] text-white/40 leading-relaxed">
                {SKIL_TEMPLATE.length} skref — NPS könnun, Google Review beiðni, sértilboð og win-back herferð.
                Allt sjálfvirkt í allt að 90 daga.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Afhendingar Tab ────────────────────────────────────────────────────────

function AfhendingarTab({
  afhendingar, bilarInRental, expandedWorkflow, onToggleExpand, onActivate, onSkraSkilBils,
}: {
  afhendingar: AfhendingWorkflow[];
  bilarInRental: Bill[];
  expandedWorkflow: string | null;
  onToggleExpand: (id: string) => void;
  onActivate: () => void;
  onSkraSkilBils: (billId: string) => void;
}) {
  const activeWfs = afhendingar.filter(a => a.status === 'virkt');

  return (
    <div className="space-y-6">
      {/* Active Delivery Workflows */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Virk afhendingarferli</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">{activeWfs.length}</span>
          </div>
          <button onClick={onActivate} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nýtt ferli
          </button>
        </div>

        {activeWfs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-white/50 mb-2">Engin virk afhendingarferli</p>
            <p className="text-xs text-white/30 mb-4">Smelltu á &quot;Virkja afhendingarferli&quot; til að hefja sjálfvirkt ferli</p>
            <button onClick={onActivate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              Virkja afhendingarferli
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeWfs.map(wf => {
              const bill = bilar.find(b => b.id === wf.billId);
              const company = wf.fyrirtaekiId ? getFyrirtaeki(wf.fyrirtaekiId) : null;
              const isExpanded = expandedWorkflow === wf.id;
              const completedSteps = wf.skref.filter(s => s.status === 'sent' || s.status === 'svarað').length;
              const daysActive = daysSince(wf.afhentDags);
              const daysToReturn = daysUntil(wf.asetlutSkilaDags);

              return (
                <div key={wf.id}>
                  <div
                    className="px-6 py-4 hover:bg-white/[0.02] cursor-pointer flex items-center gap-4 transition-colors"
                    onClick={() => onToggleExpand(wf.id)}
                  >
                    <svg className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/bilar/${wf.billId}`} onClick={e => e.stopPropagation()} className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                          {bill?.tegund}
                        </Link>
                        <span className="text-xs text-white/30">{bill?.numer}</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{company?.nafn} • {wf.tengiliðurNafn} • Afhent {formatDate(wf.afhentDags)}</div>
                    </div>
                    <div className="text-xs text-white/40 shrink-0 text-right">
                      <div>Dagur {daysActive} af ferli</div>
                      <div className="text-white/30">{daysToReturn}d til skila</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs text-white/40">{completedSteps}/{wf.skref.length}</span>
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(completedSteps / wf.skref.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pl-14">
                      <WorkflowTimeline steps={wf.skref} accentColor="blue" />
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSkraSkilBils(wf.billId); }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/15 text-emerald-400 text-xs font-medium hover:bg-emerald-600/25 transition-colors border border-emerald-500/20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Skrá bíl móttekinn
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cars in Rental (not yet activated) */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Bílar í leigu — án sjálfvirks ferlis</h2>
          <p className="text-xs text-white/30 mt-0.5">Smelltu á &quot;Virkja&quot; til að hefja sjálfvirkt afhendingarferli</p>
        </div>
        <div className="divide-y divide-white/5">
          {bilarInRental.slice(0, 10).map(b => {
            const company = b.fyrirtaekiId ? getFyrirtaeki(b.fyrirtaekiId) : null;
            const samningur = samningar.find(s => s.bilanumer === b.numer && s.status === 'virkur');
            return (
              <div key={b.id} className="px-6 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{b.tegund}</span>
                    <span className="text-xs text-white/30">{b.numer} • {b.litur}</span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {company?.nafn ?? 'Enginn leigjandi'}
                    {samningur && ` • Samningur til ${formatDate(samningur.lokadagur)}`}
                  </div>
                </div>
                <button
                  onClick={() => onActivate()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-xs font-medium hover:bg-blue-600/25 transition-colors border border-blue-500/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Virkja
                </button>
              </div>
            );
          })}
          {bilarInRental.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-white/30">Allir bílar í leigu hafa virkt ferli</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Eftirfylgni Tab ────────────────────────────────────────────────────────

function EftirfylgniTab({
  skil, expandedWorkflow, onToggleExpand, onNpsSvar, onActivate,
}: {
  skil: SkilWorkflow[];
  expandedWorkflow: string | null;
  onToggleExpand: (id: string) => void;
  onNpsSvar: (skilId: string, score: number, comment: string) => void;
  onActivate: () => void;
}) {
  const activeSkil = skil.filter(s => s.status === 'virkt');

  return (
    <div className="space-y-6">
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Virk skilaferli & CRM eftirfylgni</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">{activeSkil.length}</span>
          </div>
          <button onClick={onActivate} className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Skrá bíl móttekinn
          </button>
        </div>

        {activeSkil.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-sm text-white/50 mb-2">Engin virk skilaferli</p>
            <p className="text-xs text-white/30 mb-4">Þegar bíll er skilað inn hefst sjálfvirkt CRM eftirfylgniferli</p>
            <button onClick={onActivate} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">
              Skrá bíl móttekinn
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeSkil.map(wf => {
              const bill = bilar.find(b => b.id === wf.billId);
              const company = wf.fyrirtaekiId ? getFyrirtaeki(wf.fyrirtaekiId) : null;
              const isExpanded = expandedWorkflow === wf.id;
              const completedSteps = wf.skref.filter(s => s.status === 'sent' || s.status === 'svarað').length;
              const daysSinceReturn = daysSince(wf.skilaDags);
              const npsColor = wf.npsScore !== undefined ? getNpsCategory(wf.npsScore).color : undefined;

              return (
                <div key={wf.id}>
                  <div
                    className="px-6 py-4 hover:bg-white/[0.02] cursor-pointer flex items-center gap-4 transition-colors"
                    onClick={() => onToggleExpand(wf.id)}
                  >
                    <svg className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{bill?.tegund}</span>
                        <span className="text-xs text-white/30">{bill?.numer}</span>
                        {wf.npsScore !== undefined && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: npsColor + '15', color: npsColor }}>
                            NPS: {wf.npsScore}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{company?.nafn} • {wf.tengiliðurNafn} • Skilað {formatDate(wf.skilaDags)}</div>
                    </div>
                    <div className="text-xs text-white/40 shrink-0">
                      Dagur {daysSinceReturn} af eftirfylgni
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs text-white/40">{completedSteps}/{wf.skref.length}</span>
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(completedSteps / wf.skref.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pl-14">
                      <WorkflowTimeline steps={wf.skref} accentColor="purple" />
                      {wf.npsScore === undefined && (
                        <NpsCollector
                          skilId={wf.id}
                          onSubmit={onNpsSvar}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CRM Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'NPS könnun', desc: 'Sjálfvirk NPS könnun send 1 degi eftir skil. Mælir tryggð viðskiptavinar.', color: '#a855f7', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
          { title: 'Sértilboð', desc: '5% afsláttur á næstu leigu sent sjálfkrafa 14 dögum eftir skil.', color: '#22c55e', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { title: 'Win-back', desc: 'Eftir 90 daga fá óvirkir viðskiptavinir sérstakt 10% afsláttartilboð.', color: '#f59e0b', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        ].map((item, i) => (
          <div key={i} className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: item.color + '15' }}>
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke={item.color} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-white mb-1">{item.title}</h4>
            <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kannanir Tab ───────────────────────────────────────────────────────────

function KannanirTab({
  kannanir, npsScores, onShowDetail,
}: {
  kannanir: KonnunSvar[];
  npsScores: { score: number; promoters: number; passives: number; detractors: number; total?: number };
  onShowDetail: (k: KonnunSvar) => void;
}) {
  const npsKannanir = kannanir.filter(k => k.tegund === 'nps');
  const afhendingKannanir = kannanir.filter(k => k.tegund === 'afhending');
  const avgAfhending = afhendingKannanir.length > 0
    ? (afhendingKannanir.reduce((acc, k) => acc + k.score, 0) / afhendingKannanir.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* NPS Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161822] rounded-xl border border-white/5 p-6">
          <div className="text-xs font-medium text-white/40 mb-2">NPS skor</div>
          <div className={`text-5xl font-bold ${npsScores.score >= 50 ? 'text-green-400' : npsScores.score >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {npsScores.score > 0 ? '+' : ''}{npsScores.score}
          </div>
          <div className="text-xs text-white/30 mt-2">
            {npsScores.score >= 70 ? 'Framúrskarandi' : npsScores.score >= 50 ? 'Frábært' : npsScores.score >= 0 ? 'Gott' : 'Þarf bætingu'}
          </div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-6">
          <div className="text-xs font-medium text-white/40 mb-2">Meðaleinkunn afhendinga</div>
          <div className="text-5xl font-bold text-blue-400">{avgAfhending}</div>
          <div className="text-xs text-white/30 mt-2">{afhendingKannanir.length} svör af 5 mögulegum</div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-6">
          <div className="text-xs font-medium text-white/40 mb-2">Heildarsvör</div>
          <div className="text-5xl font-bold text-white">{kannanir.length}</div>
          <div className="text-xs text-white/30 mt-2">{npsKannanir.length} NPS • {afhendingKannanir.length} afhendingar</div>
        </div>
      </div>

      {/* NPS Distribution */}
      <div className="bg-[#161822] rounded-xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">NPS dreifing</h3>
        <div className="grid grid-cols-11 gap-1 mb-4">
          {Array.from({ length: 11 }, (_, i) => {
            const count = npsKannanir.filter(k => k.score === i).length;
            const maxCount = Math.max(1, ...Array.from({ length: 11 }, (_, j) => npsKannanir.filter(k => k.score === j).length));
            const height = count > 0 ? Math.max(20, (count / maxCount) * 100) : 8;
            const color = i >= 9 ? '#22c55e' : i >= 7 ? '#f59e0b' : '#ef4444';
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${height}%`, backgroundColor: count > 0 ? color + '60' : 'rgba(255,255,255,0.03)', border: count > 0 ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.03)' }}
                  />
                </div>
                <span className="text-[10px] text-white/40">{i}</span>
                {count > 0 && <span className="text-[10px] font-bold" style={{ color }}>{count}</span>}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/40 border border-red-500/30" />
            <span className="text-white/40">0-6: Gagnrýnendur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/30" />
            <span className="text-white/40">7-8: Hlutlausir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/40 border border-green-500/30" />
            <span className="text-white/40">9-10: Stuðningsmenn</span>
          </div>
        </div>
      </div>

      {/* All Responses */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Öll svör</h3>
        </div>
        <div className="divide-y divide-white/5">
          {kannanir.map(k => {
            const npsInfo = k.tegund === 'nps' ? getNpsCategory(k.score) : null;
            return (
              <div
                key={k.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => onShowDetail(k)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: (npsInfo?.color ?? '#3b82f6') + '15' }}>
                  <span className="text-lg font-bold" style={{ color: npsInfo?.color ?? '#3b82f6' }}>
                    {k.score}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{k.tengiliðurNafn}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      {k.tegund === 'nps' ? 'NPS' : 'Afhending'}
                    </span>
                    {npsInfo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: npsInfo.color + '15', color: npsInfo.color }}>
                        {npsInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {k.fyrirtaekiNafn} • {k.billTegund} ({k.billNumer})
                  </div>
                  {k.athugasemd && (
                    <p className="text-xs text-white/50 mt-1 italic truncate">&quot;{k.athugasemd}&quot;</p>
                  )}
                </div>
                <div className="text-xs text-white/30 shrink-0">{formatDate(k.dagsetning)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Timeline ──────────────────────────────────────────────────────

function WorkflowTimeline({ steps, accentColor }: { steps: WorkflowStep[]; accentColor: 'blue' | 'purple' }) {
  const sortedSteps = [...steps].sort((a, b) => new Date(a.dagsetning).getTime() - new Date(b.dagsetning).getTime());
  const colorMap = {
    blue: { line: 'bg-blue-500/30', activeDot: 'border-blue-500 bg-blue-500/30', completeDot: 'border-green-500 bg-green-500/30' },
    purple: { line: 'bg-purple-500/30', activeDot: 'border-purple-500 bg-purple-500/30', completeDot: 'border-green-500 bg-green-500/30' },
  };
  const colors = colorMap[accentColor];

  return (
    <div className="space-y-0 mt-4">
      {sortedSteps.map((step, i) => {
        const cfg = EVENT_TYPE_CONFIG[step.tegund];
        const statusCfg = STATUS_CONFIG[step.status];
        const isCompleted = step.status === 'sent' || step.status === 'svarað';
        const isLast = i === sortedSteps.length - 1;

        return (
          <div key={step.id} className="flex gap-3 relative">
            {!isLast && (
              <div className={`absolute left-[11px] top-[28px] bottom-0 w-px ${colors.line}`} />
            )}
            <div className="flex flex-col items-center shrink-0 pt-1.5">
              <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                isCompleted ? colors.completeDot : step.status === 'sleppt' ? 'border-white/10 bg-white/5' : colors.activeDot
              }`}>
                {isCompleted && (
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className={`flex-1 pb-4 ${!isLast ? 'mb-0' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${isCompleted ? 'text-white/70' : 'text-white/40'}`}>{step.titill}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.bgColor}`} style={{ color: cfg.color }}>{cfg.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
              <div className="text-[11px] text-white/30">{step.lysing}</div>
              <div className="text-[11px] text-white/20 mt-0.5">{formatDate(step.dagsetning)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NPS Collector ──────────────────────────────────────────────────────────

function NpsCollector({ skilId, onSubmit }: { skilId: string; onSubmit: (id: string, score: number, comment: string) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  return (
    <div className="mt-4 p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/15">
      <h4 className="text-xs font-semibold text-purple-300 mb-3">Skrá NPS svar</h4>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 11 }, (_, i) => {
          const cat = getNpsCategory(i);
          return (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                score === i
                  ? 'scale-110 shadow-lg'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: score === i ? cat.color + '30' : 'rgba(255,255,255,0.03)',
                color: score === i ? cat.color : 'rgba(255,255,255,0.4)',
                border: score === i ? `2px solid ${cat.color}50` : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {i}
            </button>
          );
        })}
      </div>
      {score !== null && (
        <>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Athugasemd frá viðskiptavini (valfrjálst)..."
            rows={2}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none mb-3"
          />
          <button
            onClick={() => onSubmit(skilId, score, comment)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Skrá NPS svar ({score}/10)
          </button>
        </>
      )}
    </div>
  );
}

// ─── Virkja Afhending Modal ─────────────────────────────────────────────────

function VirkjaAfhendingModal({
  bilar: availableBilar, onClose, onActivate,
}: {
  bilar: Bill[];
  onClose: () => void;
  onActivate: (billId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const filtered = useMemo(() => {
    if (!search) return availableBilar;
    const q = search.toLowerCase();
    return availableBilar.filter(b =>
      b.tegund.toLowerCase().includes(q) ||
      b.numer.toLowerCase().includes(q) ||
      (b.fyrirtaekiId && getFyrirtaeki(b.fyrirtaekiId)?.nafn.toLowerCase().includes(q))
    );
  }, [availableBilar, search]);

  const selectedCompany = selectedBill?.fyrirtaekiId ? getFyrirtaeki(selectedBill.fyrirtaekiId) : null;
  const selectedSamningur = selectedBill ? samningar.find(s => s.bilanumer === selectedBill.numer && s.status === 'virkur') : null;
  const selectedTengilidur = selectedCompany?.tengiliðir.find(t => t.aðaltengiliður) ?? selectedCompany?.tengiliðir[0];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Virkja afhendingarferli</h2>
              <p className="text-xs text-white/40 mt-0.5">Veldu bíl — sjálfvirkt CRM ferli hefst samstundis</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {!selectedBill ? (
              <>
                <input
                  type="text"
                  placeholder="Leita eftir bíl, númeraplötu eða fyrirtæki..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {filtered.map(b => {
                    const company = b.fyrirtaekiId ? getFyrirtaeki(b.fyrirtaekiId) : null;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBill(b)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{b.tegund}</div>
                          <div className="text-xs text-white/30">{b.numer} • {b.litur} • {company?.nafn ?? 'Enginn leigjandi'}</div>
                        </div>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-white/30">Engir bílar fundust</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/[0.05] border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white">{selectedBill.tegund}</div>
                      <div className="text-xs text-white/40">{selectedBill.numer} • {selectedBill.litur}</div>
                    </div>
                    <button onClick={() => setSelectedBill(null)} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {selectedCompany && (
                    <div className="text-xs text-white/50 space-y-1">
                      <div><span className="text-white/30">Fyrirtæki:</span> {selectedCompany.nafn}</div>
                      {selectedTengilidur && <div><span className="text-white/30">Tengiliður:</span> {selectedTengilidur.nafn} ({selectedTengilidur.netfang})</div>}
                      {selectedSamningur && <div><span className="text-white/30">Samningur til:</span> {formatDate(selectedSamningur.lokadagur)}</div>}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Sjálfvirkt ferli sem fer af stað</h4>
                  <div className="space-y-2">
                    {AFHENDING_TEMPLATE.map((t, i) => {
                      const cfg = EVENT_TYPE_CONFIG[t.tegund];
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                            </svg>
                          </div>
                          <span className="text-xs text-white/50 flex-1">{t.titill}</span>
                          <span className="text-[10px] text-white/30">
                            {t.dagarOffset >= 0 ? `Dagur ${t.dagarOffset}` : `${Math.abs(t.dagarOffset)}d fyrir skil`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors">
                    Hætta við
                  </button>
                  <button
                    onClick={() => onActivate(selectedBill.id)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Virkja afhendingarferli
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Skrá Skil Modal ────────────────────────────────────────────────────────

function SkraSkilModal({
  afhendingar, onClose, onSkil,
}: {
  afhendingar: AfhendingWorkflow[];
  onClose: () => void;
  onSkil: (billId: string) => void;
}) {
  const allRentalBilar = bilar.filter(b => b.status === 'í leigu' && b.fyrirtaekiId);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Bíll móttekinn — skrá skil</h2>
              <p className="text-xs text-white/40 mt-0.5">CRM eftirfylgniferli hefst sjálfkrafa eftir skil</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5">
            {afhendingar.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Bílar með virku afhendingarferli</h3>
                <div className="space-y-1.5">
                  {afhendingar.map(a => {
                    const bill = bilar.find(b => b.id === a.billId);
                    const company = a.fyrirtaekiId ? getFyrirtaeki(a.fyrirtaekiId) : null;
                    return (
                      <button
                        key={a.id}
                        onClick={() => onSkil(a.billId)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{bill?.tegund} <span className="text-white/30">({bill?.numer})</span></div>
                          <div className="text-xs text-white/40">{company?.nafn} • {a.tengiliðurNafn} • Afhent {formatDate(a.afhentDags)}</div>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium shrink-0">Skrá skil</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Allir bílar í leigu</h3>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {allRentalBilar.map(b => {
                const company = b.fyrirtaekiId ? getFyrirtaeki(b.fyrirtaekiId) : null;
                return (
                  <button
                    key={b.id}
                    onClick={() => onSkil(b.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{b.tegund} <span className="text-white/30">({b.numer})</span></div>
                      <div className="text-xs text-white/40">{company?.nafn ?? '—'}</div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium shrink-0">Skrá skil</span>
                  </button>
                );
              })}
            </div>

            {/* What happens after */}
            <div className="mt-4 p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/10">
              <h4 className="text-xs font-semibold text-purple-300 mb-2">Sjálfvirkt CRM eftirfylgniferli</h4>
              <div className="space-y-1.5">
                {SKIL_TEMPLATE.map((t, i) => {
                  const cfg = EVENT_TYPE_CONFIG[t.tegund];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                      </div>
                      <span className="text-[11px] text-white/40 flex-1">{t.titill}</span>
                      <span className="text-[10px] text-white/25">Dagur {t.dagarOffset}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Ferli Stillingar Modal ─────────────────────────────────────────────────

function FerliStillingarModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Ferli stillingar</h2>
              <p className="text-xs text-white/40 mt-0.5">Stilla sjálfvirk samskiptaferli</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Delivery Workflow Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Afhendingarferli</h3>
                  <p className="text-xs text-white/40">Sjálfvirk skref eftir afhendingu bíls</p>
                </div>
              </div>
              <div className="space-y-2">
                {AFHENDING_TEMPLATE.map((t, i) => {
                  const cfg = EVENT_TYPE_CONFIG[t.tegund];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 w-16 shrink-0">
                        <div className={`w-6 h-6 rounded ${cfg.bgColor} flex items-center justify-center`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                          </svg>
                        </div>
                        <span className="text-[10px] text-white/30">
                          {t.dagarOffset >= 0 ? `D+${t.dagarOffset}` : `D${t.dagarOffset}`}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/70">{t.titill}</div>
                        <div className="text-[11px] text-white/30">{t.lysing}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 shrink-0">Virkt</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Workflow Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Skilaferli & CRM eftirfylgni</h3>
                  <p className="text-xs text-white/40">Sjálfvirk skref eftir skil á bíl — allt að 90 daga eftirfylgni</p>
                </div>
              </div>
              <div className="space-y-2">
                {SKIL_TEMPLATE.map((t, i) => {
                  const cfg = EVENT_TYPE_CONFIG[t.tegund];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 w-16 shrink-0">
                        <div className={`w-6 h-6 rounded ${cfg.bgColor} flex items-center justify-center`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                          </svg>
                        </div>
                        <span className="text-[10px] text-white/30">D+{t.dagarOffset}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/70">{t.titill}</div>
                        <div className="text-[11px] text-white/30">{t.lysing}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 shrink-0">Virkt</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                Loka
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Könnun Detail Modal ────────────────────────────────────────────────────

function KonnunDetailModal({ konnun, onClose }: { konnun: KonnunSvar; onClose: () => void }) {
  const npsInfo = konnun.tegund === 'nps' ? getNpsCategory(konnun.score) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Könnunarsvar</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-bold mb-2" style={{ color: npsInfo?.color ?? '#3b82f6' }}>
                {konnun.score}/{konnun.maxScore}
              </div>
              {npsInfo && (
                <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: npsInfo.color + '15', color: npsInfo.color }}>
                  {npsInfo.label}
                </span>
              )}
              <div className="text-xs text-white/30 mt-2">
                {konnun.tegund === 'nps' ? 'Net Promoter Score' : 'Afhendingakönnun'}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/40">Tengiliður</span>
                <span className="text-white">{konnun.tengiliðurNafn}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/40">Fyrirtæki</span>
                <span className="text-white">{konnun.fyrirtaekiNafn}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/40">Bíll</span>
                <span className="text-white">{konnun.billTegund} ({konnun.billNumer})</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-white/40">Dagsetning</span>
                <span className="text-white">{formatDate(konnun.dagsetning)}</span>
              </div>
            </div>

            {konnun.athugasemd && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs font-medium text-white/40 mb-1">Athugasemd</div>
                <p className="text-sm text-white/70 italic">&quot;{konnun.athugasemd}&quot;</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                Loka
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
