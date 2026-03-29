import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, Plus, Check, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { Stepper } from "../../components/ui/stepper"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"

type QuestionType = "multiple-choice" | "short-answer" | "true-false"

interface Question {
  id: string
  question: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  points: number
}

interface PracticeFormData {
  title: string
  description: string
  category: string
  difficulty: string
  duration: string
  tags: string
  participants: string[]
  questions: Question[]
}

const STEPS = ["Details", "Questions", "Review"]

export function AddPracticePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<PracticeFormData>({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    duration: "",
    tags: "",
    participants: [],
    questions: [],
  })

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    question: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  })

  const mockParticipants = [
    { id: "1", name: "Sarah", avatar: "" },
    { id: "2", name: "Jon", avatar: "" },
    { id: "3", name: "Priya", avatar: "" },
    { id: "4", name: "Jake", avatar: "" },
    { id: "5", name: "Emma", avatar: "" },
    { id: "6", name: "Robert", avatar: "" },
    { id: "7", name: "Luke", avatar: "" },
    { id: "8", name: "Ethan", avatar: "" },
  ]

  const toggleParticipant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(id)
        ? prev.participants.filter((p) => p !== id)
        : [...prev.participants, id],
    }))
  }

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) return

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: currentQuestion.question,
      type: currentQuestion.type as QuestionType,
      options: currentQuestion.options || [],
      correctAnswer: currentQuestion.correctAnswer,
      points: currentQuestion.points || 10,
    }

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))

    setCurrentQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    })
  }

  const addOption = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }))
  }

  const updateOption = (index: number, value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options?.map((opt, i) => (i === index ? value : opt)),
    }))
  }

  const handleSubmit = () => {
    console.log("Practice data:", formData)
    // Handle form submission
  }

  const canProceedToStep2 = () => {
    return (
      formData.title &&
      formData.description &&
      formData.category &&
      formData.difficulty &&
      formData.duration
    )
  }

  const canProceedToStep3 = () => {
    return formData.questions.length > 0
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 sm:space-y-8 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-grayScale-100 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="flex items-start gap-3 sm:items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/content/speaking")}
            className="h-10 w-10 shrink-0 rounded-xl border border-grayScale-200 bg-white shadow-sm transition-colors hover:bg-grayScale-50 hover:border-grayScale-300"
          >
            <ArrowLeft className="h-4 w-4 text-grayScale-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900 sm:text-3xl">Add practice</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grayScale-500 sm:text-[15px]">
              Draft a practice session with questions (demo flow — wire to API when ready).
            </p>
          </div>
        </div>
        <Button className="h-11 w-full shrink-0 bg-brand-500 px-5 shadow-sm hover:bg-brand-600 sm:w-auto">
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Stepper */}
      <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
        <div className="rounded-2xl border border-grayScale-100 bg-grayScale-50/40 px-4 py-5 sm:px-6">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>
      </Card>

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <Card className="w-full overflow-hidden border-grayScale-200/80 shadow-sm">
          <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-5 sm:px-8 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 1: Details</h2>
            <p className="mt-1.5 text-sm text-grayScale-500">Basics for this practice session.</p>
          </div>
          <div className="space-y-5 p-5 sm:p-8 lg:p-10">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Practice Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter practice title"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter practice description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="grammar">Grammar</option>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="speaking">Speaking</option>
                  <option value="listening">Listening</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Difficulty
                </label>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  required
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="30"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-grayScale-100 bg-grayScale-50/30 px-5 py-4 sm:px-8 sm:py-5">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2()}
              className="min-w-[140px] bg-brand-500 shadow-sm hover:bg-brand-600"
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Questions */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Select Participants Section */}
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-4 sm:px-8 sm:py-5">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 2: Participants</h2>
              <p className="mt-1 text-sm text-grayScale-500">Optional — select who appears in this practice.</p>
            </div>
            <div className="p-5 sm:p-8">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-8">
              {mockParticipants.map((participant) => {
                const isSelected = formData.participants.includes(participant.id)
                return (
                  <div
                    key={participant.id}
                    className="group relative flex cursor-pointer flex-col items-center"
                    onClick={() => toggleParticipant(participant.id)}
                  >
                    <div className="relative">
                      <Avatar
                        className={`h-16 w-16 border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-brand-500 ring-2 ring-brand-500/20 scale-105"
                            : "border-grayScale-200 group-hover:border-brand-400 group-hover:shadow-md group-hover:scale-105"
                        }`}
                      >
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-brand-100 text-brand-600 font-medium">
                          {participant.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white shadow-sm ring-2 ring-white">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium transition-colors ${
                        isSelected ? "text-brand-600" : "text-grayScale-500 group-hover:text-grayScale-600"
                      }`}
                    >
                      {participant.name}
                    </span>
                  </div>
                )
              })}
            </div>
            </div>
          </Card>

          {/* Add Questions Section */}
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-4 sm:px-8 sm:py-5">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Questions</h2>
              <p className="mt-1 text-sm text-grayScale-500">Build your question bank, then add to the practice.</p>
            </div>
            <div className="p-5 sm:p-8">

            {/* Existing Questions */}
            {formData.questions.map((q) => (
              <div key={q.id} className="mb-4 rounded-xl border border-grayScale-200 bg-grayScale-50/50 p-4 transition-colors hover:bg-grayScale-50">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="font-medium text-grayScale-600">{q.question}</p>
                    <Badge variant="secondary">{q.points} points</Badge>
                  </div>
                <p className="text-sm text-grayScale-400">
                  Type: {q.type} | Correct Answer: {q.correctAnswer}
                </p>
              </div>
            ))}

            {/* Add New Question Form */}
            <div className="space-y-5 rounded-xl border border-dashed border-grayScale-300 bg-white p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Question
                </label>
                <Textarea
                  value={currentQuestion.question}
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                  }
                  placeholder="Enter your question"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Question Type
                  </label>
                  <Select
                    value={currentQuestion.type}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        type: e.target.value as QuestionType,
                      })
                    }
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="true-false">True/False</option>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">Points</label>
                  <Input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        points: parseInt(e.target.value) || 10,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              {currentQuestion.type === "multiple-choice" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Options
                  </label>
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="mt-1 w-full border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Correct Answer
                </label>
                {currentQuestion.type === "multiple-choice" ? (
                  <Select
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })
                    }
                  >
                    <option value="">Select correct option</option>
                    {currentQuestion.options?.map(
                      (opt, idx) =>
                        opt && (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ),
                    )}
                  </Select>
                ) : (
                  <Input
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })
                    }
                    placeholder="Enter correct answer"
                  />
                )}
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                disabled={!currentQuestion.question || !currentQuestion.correctAnswer}
                className="w-full bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add New Question
              </Button>
            </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-grayScale-200/80 bg-grayScale-50/30 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="px-6 sm:w-auto">
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3()}
              className="min-w-[140px] bg-brand-500 px-6 shadow-sm hover:bg-brand-600"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-4 sm:px-8 sm:py-5">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Step 3: Review</h2>
              <p className="mt-1 text-sm text-grayScale-500">Confirm details before creating the practice.</p>
            </div>
            <div className="p-5 sm:p-8">
            <div className="divide-y divide-grayScale-100 overflow-hidden rounded-lg border border-grayScale-200">
              {[
                { label: "Title", value: formData.title },
                { label: "Description", value: formData.description },
                { label: "Category", value: formData.category },
                { label: "Difficulty", value: formData.difficulty },
                { label: "Duration", value: `${formData.duration} minutes` },
                { label: "Tags", value: formData.tags },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  className={`flex items-baseline justify-between px-4 py-3 ${
                    idx % 2 === 0 ? "bg-grayScale-50/50" : "bg-white"
                  }`}
                >
                  <span className="text-sm font-medium text-grayScale-400">{row.label}</span>
                  <span className="text-right text-sm font-medium text-grayScale-600">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-grayScale-200/80 shadow-sm">
            <div className="border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-5 py-4 sm:px-8 sm:py-5">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-900 sm:text-xl">Questions</h2>
            </div>
            <div className="p-5 sm:p-8">
            <div className="space-y-4">
              {formData.questions.map((q, index) => (
                <div key={q.id} className="rounded-xl border border-grayScale-200 bg-grayScale-50/50 p-5 transition-colors hover:bg-grayScale-50">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-grayScale-600">
                        {index + 1}. {q.question}
                      </p>
                      <p className="mt-1.5 text-sm text-grayScale-400">
                        Type: {q.type} | Points: {q.points}
                      </p>
                    </div>
                  </div>
                  {q.type === "multiple-choice" && q.options.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`rounded-lg px-3 py-1.5 text-sm ${
                            opt === q.correctAnswer
                              ? "bg-brand-100 text-brand-700 font-medium ring-1 ring-brand-200"
                              : "bg-white text-grayScale-500 ring-1 ring-grayScale-100"
                          }`}
                        >
                          {opt}
                          {opt === q.correctAnswer && (
                            <Check className="ml-2 inline h-3.5 w-3.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 border-t border-grayScale-100 pt-2 text-sm text-grayScale-400">
                    Correct Answer: <span className="font-medium text-grayScale-600">{q.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-grayScale-200/80 bg-grayScale-50/30 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="px-6 sm:w-auto">
              Back
            </Button>
            <Button onClick={handleSubmit} className="min-w-[160px] bg-brand-500 px-6 shadow-sm hover:bg-brand-600">
              Create practice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
