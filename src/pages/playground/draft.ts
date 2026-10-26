import type { BotSettings } from '@/api/types'

// Field yang boleh ditimpa di editor draf. Sisanya diambil apa adanya dari pengaturan aktif.
export interface DraftOverrides {
  systemPrompt: string
  personaName: string
  contextMode: BotSettings['bot']['context_mode']
  primaryModel: string
  threshold: number
  topK: number
}

export function draftFrom(active: BotSettings): DraftOverrides {
  return {
    systemPrompt: active.bot.system_prompt,
    personaName: active.bot.persona?.name ?? '',
    contextMode: active.bot.context_mode,
    primaryModel: active.model.primary,
    threshold: active.bot.retrieval_threshold,
    topK: active.bot.retrieval_top_k,
  }
}

export const MODE_LABELS: Record<string, string> = {
  auto: 'Otomatis',
  full_context: 'Seluruh dokumen',
  retrieval: 'Pencarian',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Seluruh BotSettings aktif dengan field draf menimpa. Nama persona kosong tidak menimpa
// (backend mewajibkan 1-40 karakter). Angka dijepit ke rentang yang diterima backend.
export function applyDraft(active: BotSettings, draft: DraftOverrides): BotSettings {
  const name = draft.personaName.trim()
  const persona = active.bot.persona && name ? { ...active.bot.persona, name } : active.bot.persona
  return {
    ...active,
    bot: {
      ...active.bot,
      system_prompt: draft.systemPrompt,
      persona,
      context_mode: draft.contextMode,
      retrieval_threshold: clamp(draft.threshold, 0, 1),
      retrieval_top_k: clamp(Math.round(draft.topK), 1, 50),
    },
    model: { ...active.model, primary: draft.primaryModel },
  }
}
