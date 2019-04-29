import { DsOperation } from './ds-prop.decorator';
import "reflect-metadata";

const OPERATIONS_KEY = 'deserializable:operations';

export namespace DsOperations {

  export function get(target: any): any | undefined {
    const operations = Reflect.getMetadata(OPERATIONS_KEY, target);

    if (operations) {
      return Object.keys(operations)
        .reduce((copy: any, key) => {
          copy[key] = [ ...operations[key] ];
          return copy;
      }, {});
    }
  }

  export function set(target: any, operations: { [key: string]: DsOperation[] }) {
    Reflect.defineMetadata(OPERATIONS_KEY, {...operations}, target);
  }

  export function add(
      target: any, 
      key: string, 
      ops: DsOperation[]
  ) {
    let operations = get(target) || {};
    operations[key] = operations[key] || [];
    operations[key] = [ ...operations[key], ...ops ];
    set(target, operations);
  }

}