// ABOUTME: Pin Drop's world map (Leaflet with OpenStreetMap tiles): tap or press Enter to drop a pin, drag it to move it,
// ABOUTME: or, for results, show the answer, each pin and a line from each pin to the answer.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { PlayerId } from '../types'
import type { Pin } from './rules'
import { inkOn } from '../../ui/playerColors'
import { playerSymbolHtml, type PlayerSymbolId } from '../../ui/playerSymbols'
import '../../ui/PlayerSymbol.css'
import './PinMap.css'

export interface MapPlayer {
  id: PlayerId
  initials: string
  color: string
  /** Shown on the pin in place of the initials. */
  symbol?: PlayerSymbolId
}

interface PinMapProps {
  /** Screen reader name for the map. */
  label: string
  /** Pins to draw, by player id. */
  pins: Record<PlayerId, Pin>
  players: MapPlayer[]
  /** With an answer, the map shows results and can't be changed. */
  answer?: Pin
  /** The player whose pin taps and drags move. Omit for a map that only shows pins. */
  me?: PlayerId
  onPin?: (pin: Pin) => void
}

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const WORLD_CENTER: L.LatLngTuple = [20, 0]

/** Text for HTML: pins are built as an HTML string, and initials come from other players. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function pinIcon(player: MapPlayer): L.DivIcon {
  return L.divIcon({
    className: 'pd-map-pin',
    html: `<span class="pd-map-pin__head" style="background:${player.color};--player:${player.color};color:${inkOn(player.color)}">${
      player.symbol ? playerSymbolHtml(player.symbol) : escapeHtml(player.initials)
    }</span>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
  })
}

const ANSWER_ICON = L.divIcon({
  className: 'pd-map-answer',
  html: '<span class="pd-map-answer__star">★</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

/** Moves a longitude by whole turns so a line to the answer takes the short way around. */
function nearSide(lng: number, answerLng: number): number {
  let shifted = lng
  while (shifted - answerLng > 180) shifted -= 360
  while (answerLng - shifted > 180) shifted += 360
  return shifted
}

export function PinMap({ label, pins, players, answer, me, onPin }: PinMapProps) {
  const element = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const onPinRef = useRef(onPin)
  useEffect(() => {
    onPinRef.current = onPin
  })
  const editable = !answer && me !== undefined && onPin !== undefined

  // Build the map once; pins are redrawn by the effect below.
  useEffect(() => {
    if (!element.current) return
    const created = L.map(element.current, {
      center: WORLD_CENTER,
      zoom: 1,
      minZoom: 1,
      maxZoom: 17,
      worldCopyJump: true,
      // Stops panning past the poles; east and west stay open because the world repeats.
      maxBounds: [
        [-85, -1080],
        [85, 1080],
      ],
      maxBoundsViscosity: 1,
      zoomControl: true,
    })
    created.attributionControl.setPrefix(false)
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(created)
    layer.current = L.layerGroup().addTo(created)
    map.current = created

    // The map's size depends on the layout around it; recheck when that changes.
    const resize = new ResizeObserver(() => created.invalidateSize())
    resize.observe(element.current)
    return () => {
      resize.disconnect()
      created.remove()
      map.current = null
    }
  }, [])

  // Tap to place; Enter or Space places at the center (the crosshair) when the map has keyboard focus.
  useEffect(() => {
    const current = map.current
    if (!current || !editable) return
    const place = (latlng: L.LatLng) => onPinRef.current?.({ lat: latlng.lat, lng: latlng.lng })
    const onClick = (event: L.LeafletMouseEvent) => place(event.latlng)
    const container = current.getContainer()
    const onKey = (event: KeyboardEvent) => {
      if (event.target !== container) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        place(current.getCenter())
      }
    }
    current.on('click', onClick)
    container.addEventListener('keydown', onKey)
    return () => {
      current.off('click', onClick)
      container.removeEventListener('keydown', onKey)
    }
  }, [editable])

  useEffect(() => {
    const current = map.current
    const group = layer.current
    if (!current || !group) return
    group.clearLayers()
    const points: L.LatLngTuple[] = []

    for (const player of players) {
      const pin = pins[player.id]
      if (!pin) continue
      const lng = answer ? nearSide(pin.lng, answer.lng) : pin.lng
      const draggable = editable && player.id === me
      const marker = L.marker([pin.lat, lng], {
        icon: pinIcon(player),
        draggable,
        keyboard: false,
        zIndexOffset: player.id === me ? 1000 : 0,
      })
      if (draggable) {
        marker.on('dragend', () => {
          const moved = marker.getLatLng()
          onPinRef.current?.({ lat: moved.lat, lng: moved.lng })
        })
      }
      group.addLayer(marker)
      points.push([pin.lat, lng])
      if (answer) {
        group.addLayer(
          L.polyline(
            [
              [pin.lat, lng],
              [answer.lat, answer.lng],
            ],
            { color: player.color, weight: 3, dashArray: '6 6', interactive: false },
          ),
        )
      }
    }

    if (answer) {
      group.addLayer(L.marker([answer.lat, answer.lng], { icon: ANSWER_ICON, keyboard: false, zIndexOffset: 2000 }))
      points.push([answer.lat, answer.lng])
      current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 12 })
    }
  }, [pins, players, answer, me, editable])

  return (
    <div className="pd-map" data-editable={editable ? 'true' : undefined}>
      <div
        ref={element}
        className="pd-map__canvas"
        role="application"
        aria-label={label}
        aria-describedby={editable ? 'pd-map-help' : undefined}
        data-testid="pd-map"
      />
      {editable && (
        <>
          <span className="pd-map__crosshair" aria-hidden="true" />
          <p id="pd-map-help" className="visually-hidden">
            Arrow keys move the map, plus and minus zoom. Press Enter to drop your pin at the center.
          </p>
        </>
      )}
    </div>
  )
}
