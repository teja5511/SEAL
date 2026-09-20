declare module "@google/earthengine" {
  type EECallback<T = unknown> = (result: T | undefined, error?: Error | string) => void;

  interface EEComputedObject {
    get(property: string): EEComputedObject;
    evaluate<T = unknown>(callback: EECallback<T>): void;
  }

  interface EEFilter {
    eq(name: string, value: unknown): EEFilter;
  }

  interface EEReducer {
    first(): EEReducer;
  }

  interface EEGeometry {
    // Point / region geometry handle
  }

  interface EEImage extends EEComputedObject {
    select(bands: string | string[]): EEImage;
    reduceRegion(params: {
      reducer: EEReducer;
      geometry: EEGeometry;
      scale?: number;
      bestEffort?: boolean;
      maxPixels?: number;
    }): EEComputedObject;
    bandNames(): EEComputedObject;
  }

  interface EEImageCollection {
    filterBounds(geometry: EEGeometry): EEImageCollection;
    filter(filter: EEFilter): EEImageCollection;
    select(bands: string | string[]): EEImageCollection;
    sort(property: string, ascending?: boolean): EEImageCollection;
    first(): EEImage;
    size(): EEComputedObject;
  }

  interface EEDictionary extends EEComputedObject {}

  interface EEGeometryCtor {
    Point(coords: [number, number] | number[]): EEGeometry;
  }

  interface EEFilterCtor {
    eq(name: string, value: unknown): EEFilter;
  }

  interface EEReducerCtor {
    first(): EEReducer;
  }

  interface EEPrivateKey {
    client_email?: string;
    private_key?: string;
    [key: string]: unknown;
  }

  interface EarthEngine {
    ImageCollection: {
      new (id: string): EEImageCollection;
      (id: string): EEImageCollection;
    };
    Dictionary: {
      new (value: Record<string, unknown>): EEDictionary;
      (value: Record<string, unknown>): EEDictionary;
    };
    Geometry: EEGeometryCtor;
    Filter: EEFilterCtor;
    Reducer: EEReducerCtor;
    initialize(
      opt_baseurl: string | null,
      opt_tileurl: string | null,
      opt_success: () => void,
      opt_error: (err: Error) => void,
      opt_xsrfToken?: string | null,
      opt_project?: string | null
    ): void;
    data: {
      authenticateViaPrivateKey(
        privateKey: EEPrivateKey,
        success: () => void,
        error: (err: Error) => void,
        extraScopes?: string[],
        suppressDefaultScopes?: boolean
      ): void;
    };
  }

  const ee: EarthEngine;
  export default ee;
  export type { EarthEngine, EEPrivateKey };
}
