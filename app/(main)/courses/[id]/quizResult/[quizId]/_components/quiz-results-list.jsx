import { QuestionResult } from "./question-result";

export function QuestionResultsList({ answers }) {
  return (
      <section className="space-y-6">
          <h2 className="font-poppins font-bold text-xl text-foreground">
              Detailed Results
          </h2>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {answers.map((answer, index) => (
                  <QuestionResult
                      key={answer.id}
                      answer={answer}
                      questionNumber={index + 1}
                  />
              ))}
          </div>
      </section>
  )
}