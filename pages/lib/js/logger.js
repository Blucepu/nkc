import { getState } from './state';
import { detailedTime } from './time';
const { isProduction } = getState();
class Logger {
  print = (type, ...any) => {
    console.log(`[${detailedTime()}]`, `[${type}]`, ...any);
  };
  debug = (...any) => {
    if (isProduction) {
      return;
    }
    this.print('DEBUG', ...any);
  };
  info = (...any) => {
    this.print('INFO', ...any);
  };
  warning = (...any) => {
    this.print('WARN', ...any);
  };
  error = (...any) => {
    this.print('ERROR', ...any);
    console.trace();
  };
}

export const logger = new Logger();
