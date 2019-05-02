
export enum ReportType {
  Ignore = 'Ignore',
  Warn = 'Warning',
  Error = 'Error',
  Throw = 'Thrown Error'
}

export class DeserializerReporter {

  marks: any[] = [];
  invalidMarks: any[] = [];

  logPattern = (errorType, instanceName) => `Deserialization ${errorType} - issue deserializing instance of "${instanceName}":`;
  
  propPattern = (key, value, fallback) => `\n    "${key}" was ${JSON.stringify(value)}, provided -> ${JSON.stringify(fallback)}`;

  invalidPattern = (key, value, fallback) => `\n    "${key} was ${JSON.stringify(value)} and did not pass validation, provided -> ${JSON.stringify(fallback)}`;

  constructor(public actionType: ReportType, public instanceName: string, public errorCtor: any) {}

  public mark(key, value, fallback) {
    this.marks = [ ...this.marks, { key: key, value: value, fallback: fallback }];
  }

  public markInvalid(key, value, fallback) {
    this.invalidMarks = [ ...this.invalidMarks, { key: key, value: value, fallback: fallback }];
  }

  public report() {
    let log = this.logPattern(this.actionType, this.instanceName);

    if (this.marks && this.marks.length > 0) {
      this.marks.forEach((mark) => {
        log += this.propPattern(mark.key, mark.value, mark.fallback);
      });
    }

    if (this.invalidMarks && this.invalidMarks.length > 0) {
      this.invalidMarks.forEach((mark) => {
        log += this.invalidPattern(mark.key, mark.value, mark.fallback);
      });
    }

    if ((this.marks && this.marks.length > 0) || (this.invalidMarks && this.invalidMarks.length > 0)) {
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