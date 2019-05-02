import { DsOperation, DsOperationType } from './ds-prop.decorator';
import { DeserializerReporter, ReportType } from "./ds-reporter";
import { DsAttributes, Attribute } from "./ds-attributes";
import { DsOperations } from "./ds-operations";

class DsClassBuilder {

  public ignore = () => this.decoratorFactory(ReportType.Ignore);
  public warn = () => this.decoratorFactory(ReportType.Warn);
  public error = () => this.decoratorFactory(ReportType.Error);
  public throw = (errorCtor: any = Error) => this.decoratorFactory(ReportType.Throw, errorCtor);

  private getFallback = (fallback) => (
    (typeof fallback === 'function')
      ? fallback()
      : fallback
  );

  private decoratorFactory = (reportType: ReportType, errorCtor = Error) => (
    <TFunction extends Function>(target: TFunction) => {
      // save a reference to the original constructor
      const originalConstructor = target;

      // a utility function to generate instances of a class
      function instanciate(constructor: any, ...args: any[]) {
        let instance = new constructor(...args);
        return instance;
      }

      // the new constructor behavior
      const newConstructor = function(...args: any[]) {
        return instanciate(originalConstructor, ...args);
      };

      // deserialization function
      const deserializeFactory = (userDeserializer) => (
        (obj: any) => {
          let attributes = DsAttributes.get(target.prototype);
          let operations = DsOperations.get(target.prototype);
          let ret = newConstructor();
          let reporter = new DeserializerReporter(reportType, originalConstructor.name, errorCtor);

          // map values and apply operations
          Object.keys(attributes).forEach((key: string) => {
            let attribute: Attribute = attributes[key];
            let value = (obj[key] !== undefined)
              ? obj[key] 
              : undefined;

            // the breaker will stop the evaluation chain and 
            // instead force us to return the fallback value.
            // TODO: how this is handled can be improved for better logging and debugging
            let breaker = false;
            let invalid = false;
            let invalidWith: any;

            // apply operations
            if (operations[key]) {
              value = operations[key].reduce((val, operation: DsOperation) => {
                if (breaker) {
                  return val
                }
                switch(operation.type) {
                  case DsOperationType.Validator:
                    if (!operation.func(val)) {
                      breaker = true;
                      invalid = true;
                      invalidWith = val;
                    }
                    return val;
                  case DsOperationType.Resolver:
                    let res = operation.func(obj);
                    breaker = (res === undefined);
                    return res;
                  case DsOperationType.Operator:
                  default:
                    let opRes = operation.func(val);
                    breaker = (opRes === undefined);
                    return opRes;
                }
              }, value);
            }

            // if breaker was tripped log invalid
            if (breaker && invalid) {
              value = this.getFallback(attribute.fallback);
              reporter.markInvalid(key, invalidWith, value);
            }

            // mark if breaker was tripped or value does not exist
            else if (breaker || value === undefined) {
              value = this.getFallback(attribute.fallback);
              reporter.mark(key, undefined, value);
            }

            ret[key] = value;
          });

          // report issues
          reporter.report();

          // call user deserializer function if it exists
          if (userDeserializer && typeof userDeserializer === 'function') {
            userDeserializer(obj, ret);
          }

          return ret;
        }
      );

      // copy prototype so instanceof operator still works
      newConstructor.prototype = originalConstructor.prototype;

      // set a deserializer that also calls the user declared function
      newConstructor.prototype.deserialize = deserializeFactory(newConstructor.prototype.deserialize);
      
      // return new constructor (will override original)
      return newConstructor as any;
    }
  )

}

/** 
 * Exported as a builder class instance purely for consistency sake.
 * Might be useful in the future for added functionality
 */
export const DsClass = () => new DsClassBuilder();
