type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

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

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'flaptalk-api',
    environment: process.env['NODE_ENV'] ?? 'development',
    ...normalizeContext(context),
  };

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
