/**
 * Structured logger for Gremio Estelar backend.
 * 
 * Provides consistent log formatting with:
 * - ISO timestamps
 * - Log levels (INFO, WARN, ERROR)
 * - Context tags (e.g., [BOOT], [REQ], [Socket])
 * 
 * Zero dependencies — wraps native console methods.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${context}] ${message}`;
}

/**
 * Creates a scoped logger with a fixed context tag.
 * 
 * Usage:
 *   const log = createLogger('BOOT');
 *   log.info('Server starting...');
 *   // Output: [2026-07-30T21:00:00.000Z] [INFO] [BOOT] Server starting...
 */
export function createLogger(context: string) {
  return {
    info(message: string, ...args: any[]) {
      console.log(formatMessage('INFO', context, message), ...args);
    },

    warn(message: string, ...args: any[]) {
      console.warn(formatMessage('WARN', context, message), ...args);
    },

    error(message: string, ...args: any[]) {
      console.error(formatMessage('ERROR', context, message), ...args);
    },

    /** Log a summary of multiple items (e.g., registered routes) */
    summary(label: string, items: string[]) {
      console.log(formatMessage('INFO', context, `${label} (${items.length} items)`));
      if (items.length <= 10) {
        items.forEach(item => console.log(`  ✓ ${item}`));
      }
    },
  };
}

/** Default logger for general use */
const logger = createLogger('APP');
export default logger;
