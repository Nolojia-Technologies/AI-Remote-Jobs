import { getRevisionQuestion } from "../learning/quizBank";
import { LessonReview, RevisionItem, RevisionItemType } from "./types";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const TYPES: RevisionItemType[] = ["multiple_choice", "true_false", "flashcard"];

/**
 * Builds a short, mixed-format revision session from due lessons.
 * Each due lesson yields one item; the format rotates for variety.
 */
export function buildRevisionSession(due: LessonReview[]): RevisionItem[] {
  return due.map((review, i) => {
    const q = getRevisionQuestion(review.lessonId);
    const type = TYPES[(hash(review.lessonId) + i) % TYPES.length];

    if (type === "true_false") {
      const showCorrect = hash(review.lessonId + "tf") % 2 === 0;
      const wrong = q.options.find((o) => o !== q.answer) ?? q.answer;
      const statement = showCorrect ? q.answer : wrong;
      return {
        lessonId: review.lessonId,
        topic: review.topic,
        type,
        prompt: q.question,
        answer: q.answer,
        statement,
        statementIsTrue: showCorrect,
      };
    }

    if (type === "flashcard") {
      return {
        lessonId: review.lessonId,
        topic: review.topic,
        type,
        prompt: q.question,
        answer: q.answer,
        front: q.question,
        back: q.answer,
      };
    }

    // multiple_choice
    return {
      lessonId: review.lessonId,
      topic: review.topic,
      type,
      prompt: q.question,
      options: q.options,
      answer: q.answer,
    };
  });
}
