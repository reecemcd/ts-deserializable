
export enum ReportType {
  Ignore = 'Ignore',
  Warn = 'Warning',
  Error = 'Error',
  Throw = 'Thrown Error'
}

export class DeserializerReporter {

  marks: any[] = [];

  propPattern = (key, value, fallback) => `\n    "${key}" was ${JSON.stringify(value)}, provided -> ${JSON.stringify(fallback)}`;

  logPattern = (errorType, instanceName) => `Deserialization ${errorType} - issue deserializing instance of "${instanceName}":`;

  constructor(public actionType: ReportType, public instanceName: string, public errorCtor: any) {}

  public mark(key, value, fallback) {
    this.marks = [ ...this.marks, { key: key, value: value, fallback: fallback }];
  }

  public report() {
    if (this.marks && this.marks.length > 0) {
      let log = this.logPattern(this.actionType, this.instanceName);
      this.marks.forEach((mark) => {
        log += this.propPattern(mark.key, mark.value, mark.fallback);
      });

      switch (this.actionType) {
        case ReportType.Warn:
          console.warn(log);
          break;
        case ReportType.Error:
          console.error(log);
          break;
        case ReportType.Throw:
          throw new this.errorCtor(log);
        case ReportType.Ignore:
        default:
          break;
      }
    }
  }
}