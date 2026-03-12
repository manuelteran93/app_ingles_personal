import { phrasalVerbsByModule } from "./phrasalVerbs";
import { phraseExamplesModule1 } from "./phraseExamplesModule1";
import { phraseExamplesModule2 } from "./phraseExamplesModule2";
import { phraseExamplesModule3 } from "./phraseExamplesModule3";

const explicitPhraseExamples = {
  ...phraseExamplesModule1,
  ...phraseExamplesModule2,
  ...phraseExamplesModule3,
};

const WORD_PRONUNCIATIONS = {
  a: "a",
  about: "abáut",
  after: "áfter",
  again: "aguén",
  all: "ol",
  and: "and",
  at: "at",
  before: "bifór",
  better: "béter",
  class: "clas",
  conversation: "conver-séishon",
  conversations: "conver-séishons",
  correctly: "coréctli",
  day: "dei",
  everyday: "évri-dei",
  english: "ínglish",
  examples: "ig-zám-pols",
  feels: "fíls",
  first: "ferst",
  how: "jau",
  i: "ai",
  in: "in",
  it: "it",
  little: "lírol",
  me: "mi",
  more: "mor",
  my: "mai",
  natural: "ná-chu-ral",
  notebook: "nóut-buk",
  practice: "práktis",
  real: "ríal",
  remember: "rimém-ber",
  repeat: "ripít",
  sentence: "séntens",
  shows: "shóus",
  simple: "sím-pel",
  sounds: "sáundz",
  teacher: "tí-cher",
  the: "de",
  this: "dis",
  to: "tu",
  use: "iús",
  voice: "vois",
  we: "ui",
  with: "uiz",
  write: "rait",
};

function approximateWord(word) {
  const cleanWord = word.toLowerCase();

  if (!cleanWord) {
    return "";
  }

  if (WORD_PRONUNCIATIONS[cleanWord]) {
    return WORD_PRONUNCIATIONS[cleanWord];
  }

  return cleanWord
    .replace(/tion/g, "shon")
    .replace(/sion/g, "shon")
    .replace(/ough/g, "ou")
    .replace(/eigh/g, "ei")
    .replace(/igh/g, "ai")
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/qu/g, "ku")
    .replace(/wh/g, "u")
    .replace(/wr/g, "r")
    .replace(/kn/g, "n")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/th/g, "d")
    .replace(/ee/g, "i")
    .replace(/ea/g, "i")
    .replace(/oo/g, "u")
    .replace(/ou/g, "au")
    .replace(/ow/g, "au")
    .replace(/ay/g, "ei")
    .replace(/ai/g, "ei")
    .replace(/oa/g, "ou")
    .replace(/ie/g, "i")
    .replace(/ei/g, "ei")
    .replace(/gh/g, "")
    .replace(/w/g, "u")
    .replace(/j/g, "y")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/x/g, "ks")
    .replace(/y$/g, "i")
    .replace(/y/g, "i");
}

function approximatePronunciation(sentence) {
  return sentence
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) {
        return part;
      }

      const prefix = part.match(/^["'([{]+/u)?.[0] ?? "";
      const suffix = part.match(/[.,!?;:")\]}]+$/u)?.[0] ?? "";
      const core = part.slice(prefix.length, part.length - suffix.length);

      return `${prefix}${approximateWord(core)}${suffix}`;
    })
    .join("");
}

function buildGeneratedExamples(phrase) {
  const lessonName = phrase.phrase;

  return [
    {
      sentence: phrase.example,
      translation: phrase.exampleTranslation,
      pronunciation: approximatePronunciation(phrase.example),
    },
    {
      sentence: `In class, we practice "${lessonName}" with simple examples.`,
      translation: `En clase practicamos "${lessonName}" con ejemplos sencillos.`,
      pronunciation: approximatePronunciation(`In class, we practice ${lessonName} with simple examples.`),
    },
    {
      sentence: `My teacher shows me how "${lessonName}" sounds in everyday English.`,
      translation: `Mi profesor me muestra cómo suena "${lessonName}" en el inglés de todos los días.`,
      pronunciation: approximatePronunciation(`My teacher shows me how ${lessonName} sounds in everyday English.`),
    },
    {
      sentence: `I write "${lessonName}" in my notebook to remember it better.`,
      translation: `Escribo "${lessonName}" en mi cuaderno para recordarlo mejor.`,
      pronunciation: approximatePronunciation(`I write ${lessonName} in my notebook to remember it better.`),
    },
    {
      sentence: `Little by little, "${lessonName}" feels more natural in conversation.`,
      translation: `Poco a poco, "${lessonName}" se siente más natural en conversación.`,
      pronunciation: approximatePronunciation(`Little by little, ${lessonName} feels more natural in conversation.`),
    },
  ];
}

const generatedPhraseExamples = Object.fromEntries(
  Object.values(phrasalVerbsByModule)
    .flat()
    .map((phrase) => [phrase.id, buildGeneratedExamples(phrase)]),
);

export const phraseExamples = {
  ...generatedPhraseExamples,
  ...explicitPhraseExamples,
};
