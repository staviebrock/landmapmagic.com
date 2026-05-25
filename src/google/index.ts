/**
 * landmapmagic/google
 *
 * Adapter that turns the LandMapMagic /v1/styles?target=google response
 * into deck.gl layers and mounts them on a Google Maps instance via
 * GoogleMapsOverlay (or a `WebGLOverlayView`-like surface). Peer-deps
 * (`@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/geo-layers`,
 * `@deck.gl/google-maps`) should be supplied by the caller.
 */
import {
  fetchLandStyle,
  type LayerSpec,
} from '../core/styles-client.js';

export interface GoogleMountOptions {
  apiKey: string;
  apiUrl?: string;
  layers: LayerSpec[];
  /** Google Maps map instance (`google.maps.Map`). */
  map: any;
  /** Pre-created GoogleMapsOverlay (`new GoogleMapsOverlay({ layers: [] })`). */
  overlay: any;
  /**
   * deck.gl layer constructors. Pass them in so we don't force the user to
   * bundle deck.gl when they only need the type definitions.
   */
  decklayers: {
    MVTLayer: any;
    TileLayer?: any;
    BitmapLayer?: any;
    TextLayer?: any;
  };
  signal?: AbortSignal;
}

export interface GoogleMountResult {
  /** deck.gl layer instances created. */
  layers: any[];
  /** Detach from the overlay (sets layers to []). */
  remove: () => void;
}

interface ZoomScalar { byZoom: Array<{ zoom: number; value: any }> }
interface ByPropertyAccessor {
  byProperty: { property: string; rules: Record<string, any>; default?: any };
}
interface StaticAccessor { static: any }

function isStatic(a: any): a is StaticAccessor {
  return a && typeof a === 'object' && 'static' in a;
}
function isByZoom(a: any): a is ZoomScalar {
  return a && typeof a === 'object' && Array.isArray(a.byZoom);
}
function isByProperty(a: any): a is ByPropertyAccessor {
  return a && typeof a === 'object' && a.byProperty?.property;
}

/** Linear-interp zoom scalar; falls back to the closest stop. */
function interpByZoom(stops: Array<{ zoom: number; value: any }>, zoom: number): any {
  if (stops.length === 0) return undefined;
  if (zoom <= stops[0].zoom) return stops[0].value;
  if (zoom >= stops[stops.length - 1].zoom) return stops[stops.length - 1].value;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (zoom >= a.zoom && zoom <= b.zoom) {
      // Numbers interpolate linearly; arrays (colors) interpolate
      // component-wise; anything else takes the lower stop.
      const t = (zoom - a.zoom) / (b.zoom - a.zoom);
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return a.value + (b.value - a.value) * t;
      }
      if (Array.isArray(a.value) && Array.isArray(b.value)) {
        return a.value.map((av: number, idx: number) =>
          Math.round(av + ((b.value as number[])[idx] - av) * t)
        );
      }
      return a.value;
    }
  }
  return stops[stops.length - 1].value;
}

function resolveAccessor(accessor: any, ctx: { zoom: number; props?: any }): any {
  if (accessor == null) return undefined;
  if (isStatic(accessor)) return accessor.static;
  if (isByZoom(accessor)) return interpByZoom(accessor.byZoom, ctx.zoom);
  if (isByProperty(accessor)) {
    if (!ctx.props) return accessor.byProperty.default;
    const key = ctx.props[accessor.byProperty.property];
    return accessor.byProperty.rules[String(key)] ?? accessor.byProperty.default;
  }
  return accessor;
}

interface TextAccessor {
  template?: string;
  field?: string;
  fieldFallbacks?: string[];
  compose?: string[];
  suffix?: string;
}

function resolveTextValue(props: Record<string, any>, t: TextAccessor | undefined): string {
  if (!t) return '';
  if (t.template) return t.template.replace(/\{(\w+)\}/g, (_m, k) => String(props[k] ?? ''));
  if (t.field) {
    const v = props[t.field];
    return v == null ? '' : `${v}${t.suffix ?? ''}`;
  }
  if (t.fieldFallbacks) {
    for (const k of t.fieldFallbacks) {
      const v = props[k];
      if (v != null && v !== '') return String(v);
    }
  }
  if (t.compose) {
    return t.compose.map((k) => props[k]).filter((v) => v != null).join(' ');
  }
  return '';
}

/**
 * Mount a LandMapMagic style on a Google Map via deck.gl GoogleMapsOverlay.
 *
 * ```ts
 * import { GoogleMapsOverlay } from '@deck.gl/google-maps';
 * import { MVTLayer } from '@deck.gl/geo-layers';
 * import { TextLayer } from '@deck.gl/layers';
 * import { mountGoogleLandMap } from 'landmapmagic/google';
 *
 * const overlay = new GoogleMapsOverlay({ layers: [] });
 * overlay.setMap(map);
 *
 * const result = await mountGoogleLandMap({
 *   apiKey: 'lmm_live_…',
 *   layers: ['clu', 'cdl:2024'],
 *   map,
 *   overlay,
 *   decklayers: { MVTLayer, TextLayer },
 * });
 * ```
 */
export async function mountGoogleLandMap(
  options: GoogleMountOptions
): Promise<GoogleMountResult> {
  const { apiKey, apiUrl, layers, overlay, decklayers, signal } = options;
  // `map` is part of the public signature for parity with the Leaflet
  // adapter, but deck.gl's GoogleMapsOverlay reads the map from `setMap()`.
  void options.map;
  const { MVTLayer, TextLayer, TileLayer, BitmapLayer } = decklayers;
  if (!MVTLayer) {
    throw new Error('mountGoogleLandMap: decklayers.MVTLayer is required.');
  }

  const style = (await fetchLandStyle({
    apiKey,
    apiUrl,
    target: 'google',
    layers,
    signal,
  })) as { overlays: any[] };

  const created: any[] = [];

  for (const overlayDesc of style.overlays) {
    if (overlayDesc.type === 'mvt') {
      // One MVTLayer per sub-layer so accessors stay per-role.
      for (const sub of overlayDesc.subLayers) {
        const acc = sub.accessors ?? {};
        const sourceLayer = acc.sourceLayer ?? overlayDesc.sourceLayer;

        if (sub.role === 'label') {
          // Render labels via TextLayer fed by an MVTLayer pinned to the
          // labels source-layer. Dedup is enforced by passing the label id
          // as the React key via getText callback gating in
          // onTileLoad/getTileData.
          if (!TextLayer) continue; // skip silently if user didn't provide
          const labelLayerId = `${overlayDesc.id}__${sub.id}`;
          const labelLayer = new MVTLayer({
            id: labelLayerId,
            data: overlayDesc.url,
            // MVT loader requires the layer name — we pass it as a filter.
            // deck.gl exposes per-feature props so we can forward them.
            uniqueIdProperty: overlayDesc.labelIdField ?? 'lmm_label_id',
            renderSubLayers: (props: any) => {
              const features = (props.data || []).filter(
                (f: any) => f?.properties?._mvtSourceLayer === sourceLayer ||
                            f?.properties?._sourceLayer === sourceLayer ||
                            true
              );
              return new TextLayer({
                id: `${labelLayerId}__text-${props.tile?.id ?? ''}`,
                data: features,
                getPosition: (f: any) => f.geometry?.coordinates ?? [0, 0],
                getText: (f: any) => resolveTextValue(f?.properties ?? {}, acc.getText),
                getColor: (f: any) =>
                  resolveAccessor(acc.getColor, { zoom: props.zoom, props: f?.properties }) ?? [0, 0, 0, 255],
                getSize: (f: any) =>
                  resolveAccessor(acc.getSize, { zoom: props.zoom, props: f?.properties }) ?? 12,
                getColorBackground: undefined,
                outlineColor:
                  resolveAccessor(acc.getHaloColor, { zoom: props.zoom }) ?? [255, 255, 255, 255],
                outlineWidth: resolveAccessor(acc.getHaloWidth, { zoom: props.zoom }) ?? 2,
                fontFamily: 'Open Sans, Arial, sans-serif',
                getTextAnchor: 'middle',
                getAlignmentBaseline: 'center',
                billboard: false,
              });
            },
            minZoom: acc.minZoom,
            maxZoom: acc.maxZoom,
          });
          created.push(labelLayer);
          continue;
        }

        const fillStaticOnly = !isByZoom(acc.getFillColor) && !isByProperty(acc.getFillColor);
        const lineStaticOnly = !isByZoom(acc.getLineColor) && !isByProperty(acc.getLineColor);

        const layer = new MVTLayer({
          id: `${overlayDesc.id}__${sub.id}`,
          data: overlayDesc.url,
          stroked: !!acc.stroked,
          filled: !!acc.filled,
          pickable: true,
          uniqueIdProperty: overlayDesc.labelIdField ?? 'id',
          getFillColor: (f: any, ctx: any) =>
            resolveAccessor(acc.getFillColor, { zoom: ctx?.zoom ?? 0, props: f?.properties }) ??
            [0, 0, 0, 0],
          getLineColor: (f: any, ctx: any) =>
            resolveAccessor(acc.getLineColor, { zoom: ctx?.zoom ?? 0, props: f?.properties }) ??
            [0, 0, 0, 255],
          getLineWidth: (f: any, ctx: any) =>
            resolveAccessor(acc.getLineWidth, { zoom: ctx?.zoom ?? 0, props: f?.properties }) ?? 1,
          lineWidthUnits: acc.lineWidthUnits ?? 'pixels',
          minZoom: acc.minZoom,
          maxZoom: acc.maxZoom,
          updateTriggers: {
            getFillColor: fillStaticOnly ? undefined : [acc.getFillColor],
            getLineColor: lineStaticOnly ? undefined : [acc.getLineColor],
            getLineWidth: [acc.getLineWidth],
          },
        });
        created.push(layer);
      }
      continue;
    }

    if (overlayDesc.type === 'raster') {
      if (!TileLayer || !BitmapLayer) {
        // Allow raster layers to gracefully skip if deck.gl raster deps weren't passed.
        continue;
      }
      const layer = new TileLayer({
        id: overlayDesc.id,
        data: overlayDesc.url,
        tileSize: overlayDesc.tileSize ?? 256,
        minZoom: overlayDesc.minZoom,
        maxZoom: overlayDesc.maxZoom,
        opacity: typeof overlayDesc.opacity === 'number'
          ? overlayDesc.opacity
          : 1,
        renderSubLayers: (props: any) => {
          const { boundingBox } = props.tile ?? {};
          if (!boundingBox) return null;
          return new BitmapLayer({
            id: `${overlayDesc.id}__${props.tile.id}`,
            image: props.data,
            bounds: [
              boundingBox[0][0],
              boundingBox[0][1],
              boundingBox[1][0],
              boundingBox[1][1],
            ],
            opacity:
              typeof overlayDesc.opacity === 'object'
                ? resolveAccessor(overlayDesc.opacity, { zoom: props.zoom }) ?? 1
                : overlayDesc.opacity ?? 1,
          });
        },
      });
      created.push(layer);
      continue;
    }
  }

  overlay.setProps({ layers: [...(overlay.props?.layers ?? []), ...created] });

  return {
    layers: created,
    remove() {
      const remaining = (overlay.props?.layers ?? []).filter(
        (l: any) => !created.includes(l)
      );
      overlay.setProps({ layers: remaining });
    },
  };
}

export default mountGoogleLandMap;
