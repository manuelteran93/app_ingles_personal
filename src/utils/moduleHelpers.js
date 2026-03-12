import { modules } from "../data/phrasalVerbs";

export function buildModuleProgress(userProgress) {
  const progressByModule = {};

  modules.forEach((module) => {
    const items = userProgress.filter((entry) => entry.module_id === module.id);
    const learned = items.filter((entry) => entry.status === "learned").length;
    const reviewing = items.filter((entry) => entry.status === "reviewing").length;
    const total = module.phrases.length;
    const percentage = Math.round((learned / total) * 100);

    progressByModule[module.id] = {
      learned,
      reviewing,
      total,
      percentage,
      completed: learned === total,
    };
  });

  return progressByModule;
}

export function shuffleArray(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function createQuizQuestions(phrases, questionCount = 10) {
  const selected = shuffleArray(phrases).slice(0, questionCount);

  return selected.map((phrase, index) => {
    const incorrectPool = phrases.filter((item) => item.id !== phrase.id);
    const distractors = shuffleArray(incorrectPool).slice(0, 3);
    const askMeaning = index % 2 === 0;

    const options = shuffleArray(
      [phrase, ...distractors].map((item) => ({
        id: item.id,
        label: askMeaning ? item.meaning : item.phrase,
      })),
    );

    return {
      id: `${phrase.id}-${index}`,
      type: askMeaning ? "phrase-to-meaning" : "meaning-to-phrase",
      prompt: askMeaning ? phrase.phrase : phrase.meaning,
      supportText: askMeaning ? phrase.example : phrase.exampleTranslation,
      correctAnswer: askMeaning ? phrase.meaning : phrase.phrase,
      explanation: phrase.explanation,
      options,
    };
  });
}
