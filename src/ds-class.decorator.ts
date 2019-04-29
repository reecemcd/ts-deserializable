import { DsOperation, DsOperationType } from './ds-prop.decorator';
import { DeserializerReporter, ReportType } from "./ds-reporter";
import { DsAttributes, Attribute } from "./ds-attributes";
import { DsOperations } from "./ds-operations";

class DsClassBuilder {

  public ignore = () => this.decoratorFactory(ReportType.Ignore);
  public warn = () => this.decoratorFactory(ReportType.Warn);
  public error = () => this.decoratorFactory(ReportType.Error);
  public throw = (errorCtor: any = Error) => this.decoratorFactory(ReportType.Throw, errorCtor);

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

            // apply operations
            if (operations[key]) {
              value = operations[key].reduce((val, operation: DsOperation) => {
                switch(operation.type) {
                  case DsOperationType.Resolver:
                    return operation.func(obj);
                  case DsOperationType.Operator:
                  default:
                    return operation.func(val);
                }
              }, value);
            }

            // mark if value does not exist
            if (value === undefined) {
              value = (typeof attribute.fallback === 'function')
                ? attribute.fallback()
                : attribute.fallback;
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
