import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sortModelsByFamily(models) {
  return [...models].sort((a, b) => {
    if (a.family < b.family) return -1;
    if (a.family > b.family) return 1;
    return 0;
  });
}

export function matchModelFromName(models, modelName) {
  if (!modelName) return null;
  let model = models.find(m => m.openRouterName === modelName);
  return model || null;
}

export function getDisplayName(conv) {
  return (conv.name || conv.messages?.[0]?.content || 'Conversation').toLowerCase()
}

export function sortConversations(convos, search) {
  if (search.trim()) {
    const s = search.trim().toLowerCase()
    return [...convos].sort((a, b) => {
      const aName = getDisplayName(a)
      const bName = getDisplayName(b)
      const getScore = (name) => {
        if (name === s) return 0
        if (name.startsWith(s)) return 1
        if (name.includes(s)) return 2
        const idx = name.indexOf(s)
        if (idx !== -1) return 3 + idx
        return 100 + Math.abs(name.length - s.length)
      }
      const aScore = getScore(aName)
      const bScore = getScore(bName)
      if (aScore !== bScore) return aScore - bScore
      return aName.localeCompare(bName)
    })
  }
  return [...convos].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
}

export function isMac() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

export function getModifierKey() {
  return isMac() ? 'meta' : 'ctrl';
}

export function getModifierKeyIcon() {
    return isMac() ? '⌘' : 'Ctrl';
} 