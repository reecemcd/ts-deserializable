export * from './ds-class.decorator';
export * from './ds-prop.decorator';

export abstract class Deserializable<T> {
  deserialize(obj: any): T { return obj; };
}