// ABOUTME: What each player in a room looks like on screen: name, initials, color in the current style, and symbol.
// ABOUTME: Covers people in the room and any bots in the game; arcade shows initials instead of symbols.
import type { Room } from '../../engine/net/rooms'
import { PLAYER_COLORS, type PlayerColorId } from '../../ui/playerColors'
import { isPlayerSymbolId, type PlayerSymbolId } from '../../ui/playerSymbols'
import { useLobbyStyle } from '../../ui/themes/useLobbyStyle'
import type { PlayerId } from '../types'
import { botFor } from './bots'

export interface PlayerLook {
  name: string
  initials: string
  /** Hex for the current lobby style. */
  color: string
  symbol?: PlayerSymbolId
}

/** Names, colors and symbols for everyone in the room, plus any bots in the game. Arcade shows initials, not symbols. */
export function usePlayerLooks(room: Room, gamePlayers: readonly PlayerId[] = []): Record<PlayerId, PlayerLook> {
  const style = useLobbyStyle()
  const looks: Record<PlayerId, PlayerLook> = {}
  for (const id of gamePlayers) {
    const bot = botFor(id)
    if (!bot) continue
    const { name, initials, color, symbol } = bot.look
    looks[id] = { name, initials, color: PLAYER_COLORS[style][color], symbol: style === 'arcade' ? undefined : symbol }
  }
  for (const [uid, player] of Object.entries(room.players)) {
    const color = PLAYER_COLORS[style][player.color as PlayerColorId] ?? PLAYER_COLORS[style].silver
    const symbol = style !== 'arcade' && isPlayerSymbolId(player.symbol) ? player.symbol : undefined
    looks[uid] = { name: player.username, initials: player.initials, color, symbol }
  }
  return looks
}
