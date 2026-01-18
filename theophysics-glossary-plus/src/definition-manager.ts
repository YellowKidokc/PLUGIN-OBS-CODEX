import { TermDefinition } from './types';

export class DefinitionManager {
  constructor(private definitions: TermDefinition[]) {}

  addDefinition(definition: TermDefinition): TermDefinition[] {
    return [...this.definitions, definition];
  }

  updateDefinition(definition: TermDefinition): TermDefinition[] {
    return this.definitions.map((item) => (item.id === definition.id ? definition : item));
  }

  getDefinitions(): TermDefinition[] {
    return this.definitions;
  }
}
