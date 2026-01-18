import { GlossaryPlusSettings } from './settings';
import { ExternalLinks } from './dual-link-handler';

export interface TemplateContext {
  term: string;
  internalDefinition: string;
  source: string;
  externalLinks: ExternalLinks;
  uuid: string;
  aliases: string[];
  nearTerms: string[];
  domainPrimary: string;
  domainSecondary: string[];
  theophysicsFormal: string;
  theophysicsPlain: string;
  theophysicsOneLine: string;
  standardPhysics: string;
  standardPhilosophy: string;
  standardTheology: string;
  standardMathematics: string;
  divergenceNote: string;
  symbol: string;
  latex: string;
  appearsIn: string[];
  physicsManifestation: string;
  physicsExamples: string[];
  theologyManifestation: string;
  scripturalAnchor: string;
  philosophyManifestation: string;
  philosophyTradition: string;
  consciousnessManifestation: string;
  consciousnessExperiential: string;
  papers: string[];
  axioms: string[];
  laws: string[];
  theorems: string[];
  analogyPrimary: string;
  analogyMapping: string;
  analogyBreaks: string;
  analogySecondary: string[];
  wikipediaSummary: string;
  sepSummary: string;
  philpapersKeyPapers: string[];
  scholarpediaSummary: string;
  arxivPapers: string[];
  origin: string;
  etymology: string;
  evolution: string[];
  keyThinkers: string[];
  createdDate: string;
  updatedDate: string;
  status: string;
  confidence: string;
  needsWork: string[];
  relatedTerms: string[];
}

export class TemplateEngine {
  constructor(private settings: GlossaryPlusSettings) {}

  getTemplateByName(name: string): string {
    const template = this.settings.customTemplates.find((item) => item.name === name);
    return template?.template ?? this.settings.customTemplates[0]?.template ?? '';
  }

  render(template: string, context: TemplateContext): string {
    return template
      .replace(/\{\{TERM\}\}/g, context.term)
      .replace(/\{\{UUID\}\}/g, context.uuid)
      .replace(/\{\{INTERNAL_DEFINITION\}\}/g, context.internalDefinition)
      .replace(/\{\{SOURCE\}\}/g, context.source)
      .replace(/\{\{ALIASES\}\}/g, context.aliases.join(', '))
      .replace(/\{\{NEAR_TERMS\}\}/g, context.nearTerms.join(', '))
      .replace(/\{\{DOMAIN_PRIMARY\}\}/g, context.domainPrimary)
      .replace(/\{\{DOMAIN_SECONDARY\}\}/g, context.domainSecondary.join(', '))
      .replace(/\{\{THEOPHYSICS_FORMAL\}\}/g, context.theophysicsFormal)
      .replace(/\{\{THEOPHYSICS_PLAIN\}\}/g, context.theophysicsPlain)
      .replace(/\{\{THEOPHYSICS_ONE_LINE\}\}/g, context.theophysicsOneLine)
      .replace(/\{\{STANDARD_PHYSICS\}\}/g, context.standardPhysics)
      .replace(/\{\{STANDARD_PHILOSOPHY\}\}/g, context.standardPhilosophy)
      .replace(/\{\{STANDARD_THEOLOGY\}\}/g, context.standardTheology)
      .replace(/\{\{STANDARD_MATHEMATICS\}\}/g, context.standardMathematics)
      .replace(/\{\{DIVERGENCE_NOTE\}\}/g, context.divergenceNote)
      .replace(/\{\{SYMBOL\}\}/g, context.symbol)
      .replace(/\{\{LATEX\}\}/g, context.latex)
      .replace(/\{\{APPEARS_IN\}\}/g, context.appearsIn.join(', '))
      .replace(/\{\{PHYSICS_MANIFESTATION\}\}/g, context.physicsManifestation)
      .replace(/\{\{PHYSICS_EXAMPLES\}\}/g, context.physicsExamples.join(', '))
      .replace(/\{\{THEOLOGY_MANIFESTATION\}\}/g, context.theologyManifestation)
      .replace(/\{\{SCRIPTURAL_ANCHOR\}\}/g, context.scripturalAnchor)
      .replace(/\{\{PHILOSOPHY_MANIFESTATION\}\}/g, context.philosophyManifestation)
      .replace(/\{\{PHILOSOPHY_TRADITION\}\}/g, context.philosophyTradition)
      .replace(/\{\{CONSCIOUSNESS_MANIFESTATION\}\}/g, context.consciousnessManifestation)
      .replace(/\{\{CONSCIOUSNESS_EXPERIENTIAL\}\}/g, context.consciousnessExperiential)
      .replace(/\{\{PAPERS\}\}/g, context.papers.join(', '))
      .replace(/\{\{AXIOMS\}\}/g, context.axioms.join(', '))
      .replace(/\{\{LAWS\}\}/g, context.laws.join(', '))
      .replace(/\{\{THEOREMS\}\}/g, context.theorems.join(', '))
      .replace(/\{\{ANALOGY_PRIMARY\}\}/g, context.analogyPrimary)
      .replace(/\{\{ANALOGY_MAPPING\}\}/g, context.analogyMapping)
      .replace(/\{\{ANALOGY_BREAKS\}\}/g, context.analogyBreaks)
      .replace(/\{\{ANALOGY_SECONDARY\}\}/g, context.analogySecondary.join(', '))
      .replace(/\{\{WIKIPEDIA_URL\}\}/g, context.externalLinks.wikipedia ?? '')
      .replace(/\{\{WIKIPEDIA_SUMMARY\}\}/g, context.wikipediaSummary)
      .replace(/\{\{SEP_URL\}\}/g, context.externalLinks.sep ?? '')
      .replace(/\{\{SEP_SUMMARY\}\}/g, context.sepSummary)
      .replace(/\{\{PHILPAPERS_URL\}\}/g, context.externalLinks.philpapers ?? '')
      .replace(/\{\{PHILPAPERS_KEY_PAPERS\}\}/g, context.philpapersKeyPapers.join(', '))
      .replace(/\{\{SCHOLARPEDIA_URL\}\}/g, context.externalLinks.scholarpedia ?? '')
      .replace(/\{\{SCHOLARPEDIA_SUMMARY\}\}/g, context.scholarpediaSummary)
      .replace(/\{\{ARXIV_PAPERS\}\}/g, context.arxivPapers.join(', '))
      .replace(/\{\{ORIGIN\}\}/g, context.origin)
      .replace(/\{\{ETYMOLOGY\}\}/g, context.etymology)
      .replace(/\{\{EVOLUTION\}\}/g, context.evolution.join(', '))
      .replace(/\{\{KEY_THINKERS\}\}/g, context.keyThinkers.join(', '))
      .replace(/\{\{CREATED_DATE\}\}/g, context.createdDate)
      .replace(/\{\{UPDATED_DATE\}\}/g, context.updatedDate)
      .replace(/\{\{STATUS\}\}/g, context.status)
      .replace(/\{\{CONFIDENCE\}\}/g, context.confidence)
      .replace(/\{\{NEEDS_WORK\}\}/g, context.needsWork.join(', '))
      .replace(/\{\{RELATED_TERMS\}\}/g, context.relatedTerms.join(', '));
  }
}
