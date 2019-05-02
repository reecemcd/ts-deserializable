import { DsAttributes } from "./ds-attributes";
import { DsOperations } from "./ds-operations";

export interface DsOperation {
  func: Function
  type: DsOperationType
}

export enum DsOperationType {
  Operator = 'OPERATOR',
  Resolver = 'RESOLVER',
  Validator = 'VALIDATOR'
}

const getNestedPropValue = (obj, propPath, separator = '.') => {
  let pathList = Array.isArray(propPath) ? propPath : propPath.split(separator);
  return pathList.reduce((prev, curr) => prev && prev[curr], obj);
};

class DsPropBuilder {

  private operations: DsOperation[] = [];

  private addOperation(operation: DsOperation) {
    this.operations = [ ...this.operations, operation ];
  }

  // Basic Operators

  /**
   * 
   * @param func 
   */
  public tap(func: Function) {
    this.addOperation({ 
      func: (obj) => { func(); return obj; },
      type: DsOperationType.Operator
    });
    return this;
  }

  /**
   * 
   * @param func 
   */
  public map(func: Function) {
    this.addOperation({ 
      func: func,
      type: DsOperationType.Operator
    });
    return this;
  }

  /**
   * 
   * @param ctor 
   */
  public mapTo(ctor: any) {
    this.addOperation({ 
      func: (obj) => obj.map(child => new ctor().deserialize(child)),
      type: DsOperationType.Operator
    });
    return this;
  }


  // Resolvers

  /**
   * 
   * @param func 
   */
  public resolve(func: Function) {
    this.addOperation({
      func: func,
      type: DsOperationType.Resolver
    });
    return this;
  }

  /**
   * 
   * @param propPath 
   */
  public dotResolve(propPath: string | string[]) {
    this.addOperation({
      func: (obj) => getNestedPropValue(obj, propPath),
      type: DsOperationType.Resolver
    });
    return this;
  }

  // Validators

  public validate(func: Function) {
    this.addOperation({ 
      func: func,
      type: DsOperationType.Validator
    });
    return this;
  }

  public validateString() {
    this.addOperation({
      func: (val) => (typeof val === 'string'),
      type: DsOperationType.Validator
    });
    return this;
  }

  public validateNumber() {
    this.addOperation({
      func: (val) => (typeof val === 'number'),
      type: DsOperationType.Validator
    });
    return this;
  }

  public validateBoolean() {
    this.addOperation({
      func: (val) => (typeof val === 'boolean'),
      type: DsOperationType.Validator
    });
    return this;
  }

  public validateArray() {
    this.addOperation({
      func: (val) => Array.isArray(val),
      type: DsOperationType.Validator
    });
    return this;
  }

  // Build

  /**
   * 
   * @param fallbackValue 
   */
  public fb(fallbackValue: any = undefined) {
    return (target: any, key: string) => {
      const type = Reflect.getMetadata("design:type", target, key);
      DsOperations.add(target, key, this.operations);
      DsAttributes.add(target, key, type, fallbackValue);
    }
  }
}

export const DsProp = () => new DsPropBuilder();
