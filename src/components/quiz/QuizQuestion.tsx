import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { ParsedQuizQuestion } from "../../types/app.types";

interface QuizQuestionProps {
  question: ParsedQuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  showResult?: boolean;
  onAnswer: (answer: string) => void;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showResult = false,
  onAnswer,
}: QuizQuestionProps) {
  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <View className="flex-1">
      {/* Progress */}
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Question {questionNumber} of {totalQuestions}
      </Text>

      {/* Question */}
      <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-white leading-7">
          {question.question}
        </Text>
      </View>

      {/* Options */}
      <View className="gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correct_answer;

          let containerClass =
            "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700";
          let textClass = "text-gray-900 dark:text-white";

          if (showResult && isSelected && isCorrect) {
            containerClass = "bg-green-50 dark:bg-green-900/20 border-2 border-green-500";
            textClass = "text-green-700 dark:text-green-400";
          } else if (showResult && isSelected && !isCorrect) {
            containerClass = "bg-red-50 dark:bg-red-900/20 border-2 border-red-500";
            textClass = "text-red-700 dark:text-red-400";
          } else if (showResult && isCorrectOption) {
            containerClass = "bg-green-50 dark:bg-green-900/20 border-2 border-green-500";
            textClass = "text-green-700 dark:text-green-400";
          } else if (isSelected && !showResult) {
            containerClass = "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary";
            textClass = "text-primary dark:text-primary-400";
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={async () => {
                if (showResult) return;
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAnswer(option);
              }}
              activeOpacity={showResult ? 1 : 0.75}
              className={`flex-row items-center p-4 rounded-2xl ${containerClass}`}
            >
              <View className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                <Text className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text className={`flex-1 text-base font-medium ${textClass}`}>{option}</Text>
              {showResult && isCorrectOption && (
                <CheckCircle2 size={20} color="#22C55E" className="ml-2" />
              )}
              {showResult && isSelected && !isCorrect && (
                <XCircle size={20} color="#EF4444" className="ml-2" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {showResult && question.explanation && (
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mt-4">
          <Text className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
            💡 Explanation
          </Text>
          <Text className="text-sm text-blue-600 dark:text-blue-300 leading-5">
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}
