type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  public info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  public error(message: string, error?: any, meta?: any): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : error;
    
    console.error(
      this.formatMessage('error', message, {
        error: errorDetails,
        ...meta,
      })
    );
  }

  public debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
