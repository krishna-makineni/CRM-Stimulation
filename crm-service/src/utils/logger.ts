function normalizeMeta(meta: unknown): unknown {
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : meta.stack,
    };
  }

  if (meta && typeof meta === 'object' && 'error' in meta) {
    const record = meta as Record<string, unknown>;
    return {
      ...record,
      error: normalizeMeta(record.error),
    };
  }

  return meta;
}

const formatMessage = (level: string, message: string, meta?: unknown) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(normalizeMeta(meta))}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

export const logger = {
  info: (message: string, meta?: unknown) => console.log(formatMessage('INFO', message, meta)),
  warn: (message: string, meta?: unknown) => console.warn(formatMessage('WARN', message, meta)),
  error: (message: string, meta?: unknown) => console.error(formatMessage('ERROR', message, meta)),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },
};
