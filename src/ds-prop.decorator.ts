import { DsAttributes } from "./ds-attributes";
import { DsOperations } from "./ds-operations";

export interface DsOperation {
  func: Function
  type: DsOperationType
}

export enum DsOperationType {
  Operator = 'OPERATOR',
  Resolver = 'RESOLVER'
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

  public tap(func: Function) {
    this.addOperation({ 
      func: (obj) => { func(); return obj; },
      type: DsOperationType.Operator
    });
    return this;
  }

  public map(func: Function) {
    this.addOperation({ 
      func: func,
      type: DsOperationType.Operator
    });
    return this;
  }

  public mapTo(ctor: any) {
    this.addOperation({ 
      func: (obj) => obj.map(child => new ctor().deserialize(child)),
      type: DsOperationType.Operator
    });
    return this;
  }

  public resolve(func: Function) {
    this.addOperation({
      func: func,
      type: DsOperationType.Resolver
    });
    return this;
  }

  public dotResolve(propPath: string | string[]) {
    this.addOperation({
      func: (obj) => getNestedPropValue(obj, propPath),
      type: DsOperationType.Resolver
    });
    return this;
  }

  public fb(fallbackValue: any = undefined) {
    return (target: any, key: string) => {
      const type = Reflect.getMetadata("design:type", target, key);
      DsOperations.add(target, key, this.operations);
      DsAttributes.add(target, key, type, fallbackValue);
    }
  }
}

export const DsProp = () => new DsPropBuilder();
