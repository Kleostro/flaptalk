type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;
type LogPayload = LogContext & {
  readonly environment: string;
  readonly event: string;
  readonly level: LogLevel;
  readonly service: string;
  readonly timestamp: string;
};

const LOG_LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  error: 'ERROR',
  info: 'INFO ',
  warn: 'WARN ',
};

const LOG_LEVEL_COLOR: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  error: '\x1b[31m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
};

const EVENT_COLOR = '\x1b[97m';
const KEY_COLOR = '\x1b[94m';
const MUTED_COLOR = '\x1b[90m';
const ANSI_RESET = '\x1b[0m';
const SECTION_LINE = `${MUTED_COLOR}${'-'.repeat(72)}${ANSI_RESET}`;

function normalizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

function normalizeContext(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function isDevelopmentEnvironment(environment: string): boolean {
  return environment === 'development';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('en-GB', { hour12: false });
}

function formatContext(context: LogContext): string | null {
  const entries = Object.entries(context);

  if (entries.length === 0) {
    return null;
  }

  return entries
    .map(([key, value]) => {
      const formattedValue = formatContextValue(key, value);

      const indentedValue = formattedValue.replaceAll('\n', '\n    ');

      return `  ${KEY_COLOR}${key}${ANSI_RESET}: ${indentedValue}`;
    })
    .join('\n');
}

function formatContextValue(key: string, value: unknown): string {
  if (key === 'status' && typeof value === 'number') {
    return `${getStatusColor(value)}${String(value)}${ANSI_RESET}`;
  }

  if (key === 'durationMs' && typeof value === 'number') {
    const color =
      value >= 1000
        ? LOG_LEVEL_COLOR.error
        : value >= 300
          ? LOG_LEVEL_COLOR.warn
          : LOG_LEVEL_COLOR.info;

    return `${color}${value}ms${ANSI_RESET}`;
  }

  if (key === 'method' && typeof value === 'string') {
    return `${getMethodColor(value)}${value}${ANSI_RESET}`;
  }

  if (key === 'path' && typeof value === 'string') {
    return `${EVENT_COLOR}${value}${ANSI_RESET}`;
  }

  if (key === 'requestId' && typeof value === 'string') {
    return `${MUTED_COLOR}${value}${ANSI_RESET}`;
  }

  return typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? String(value));
}

function getMethodColor(method: string): string {
  switch (method) {
    case 'DELETE':
      return LOG_LEVEL_COLOR.error;
    case 'PATCH':
    case 'PUT':
      return LOG_LEVEL_COLOR.warn;
    case 'POST':
      return LOG_LEVEL_COLOR.info;
    default:
      return EVENT_COLOR;
  }
}

function getStatusColor(status: number): string {
  if (status >= 500) {
    return LOG_LEVEL_COLOR.error;
  }

  if (status >= 400) {
    return LOG_LEVEL_COLOR.warn;
  }

  if (status >= 300) {
    return LOG_LEVEL_COLOR.debug;
  }

  return LOG_LEVEL_COLOR.info;
}

function writePretty(level: LogLevel, payload: LogPayload): void {
  const { environment, event, service, timestamp, ...context } = payload;
  const color = LOG_LEVEL_COLOR[level];
  const label = LOG_LEVEL_LABEL[level];
  const header =
    `${color}[${label}]${ANSI_RESET} ${formatTimestamp(timestamp)} ${service} ` +
    `${EVENT_COLOR}${event}${ANSI_RESET}` +
    (environment === 'development' ? '' : ` env=${environment}`);
  const formattedContext = formatContext(context);
  const output = formattedContext
    ? `${SECTION_LINE}\n${header}\n${formattedContext}\n${SECTION_LINE}`
    : `${SECTION_LINE}\n${header}\n${SECTION_LINE}`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const environment = process.env['NODE_ENV'] ?? 'development';
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'flaptalk-api',
    environment,
    ...normalizeContext(context),
  };

  if (isDevelopmentEnvironment(environment)) {
    writePretty(level, payload);
    return;
  }

  const line = JSON.stringify(payload);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

export const logger = {
  debug(event: string, context?: LogContext) {
    write('debug', event, context);
  },
  info(event: string, context?: LogContext) {
    write('info', event, context);
  },
  warn(event: string, context?: LogContext) {
    write('warn', event, context);
  },
  error(event: string, context?: LogContext) {
    write('error', event, context);
  },
};
