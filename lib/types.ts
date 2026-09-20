export type ClogClass = "clear" | "silt" | "plastic" | "blocked";
export type CrewSignal = "WORK" | "SHADE_BREAK" | "HOLD";
export type JobStatus = "idle" | "queued" | "dispatched" | "held" | "verified" | "rejected";
export type AlertLevel = "WATCH" | "YELLOW" | "RED";
export type DataSource = "weathernext3" | "open-meteo" | "replay" | "gee-cache";
export type MapLayer = "risk" | "rainfall" | "wbgt";
export type MapVisible = { RED: boolean; YELLOW: boolean; WATCH: boolean; sealed: boolean };

export type NalaSeed = {
  id: string;
  nameEn: string;
  nameTe: string;
  lng: number;
  lat: number;
  ward: string;
  clog: number;
  clogClass: ClogClass;
  basinProxy: number;
  households: number;
  historyFloodM: number;
  crew: string;
  payInr: number;
};

export type RankedNala = NalaSeed & {
  forecastMm: number;
  precipP90Mm: number;
  risk: number;
  alert: AlertLevel;
  reason: string;
  status: JobStatus;
  waterProb: number;
  ndwi: number;
  ndbi: number;
  elevationM: number;
};

export type WeatherPacket = {
  source: DataSource;
  initTime: string;
  forecastHour: number;
  precipMeanMm: number;
  precipP90Mm: number;
  tempC: number;
  dewC: number;
  humidity: number;
  windMs: number;
  wbgtC: number;
  crewSignal: CrewSignal;
  crewReason: string;
};

export type ProofRecord = {
  nalaId: string;
  beforeUrl: string;
  afterUrl: string;
  beforeClog: number;
  afterClog: number;
  verified: boolean;
  paidInr: number;
  kgPlastic: number;
  at: string;
};

export type AppState = {
  hour: number;
  playing: boolean;
  liveWeather: boolean;
  weather: WeatherPacket;
  nalas: RankedNala[];
  proofs: ProofRecord[];
  selectedId: string | null;
  splitView: boolean;
};
