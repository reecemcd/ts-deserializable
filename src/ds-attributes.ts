import "reflect-metadata";

const ATTRIBUTES_KEY = 'deserializable:attributes';

export interface Attribute {
  type: string;
  fallback: any;
}

export namespace DsAttributes {

  export function get(target: any): any | undefined {
    const attributes = Reflect.getMetadata(ATTRIBUTES_KEY, target);

    if (attributes) {
      return Object.keys(attributes)
        .reduce((copy: any, key) => {
          copy[key] = {...attributes[key]};
          return copy;
      }, {});
    }
  }

  export function set(target: any, attributes: { [key: string]: Attribute }) {
    Reflect.defineMetadata(ATTRIBUTES_KEY, {...attributes}, target);
  }

  export function add(
      target: any, 
      key: string, 
      type: any, 
      fallback: any,
  ) {
    let attributes = get(target) || {};

    attributes[key] = {
      type: type,
      fallback: fallback,
    } as Attribute;

    set(target, attributes);
  }

}