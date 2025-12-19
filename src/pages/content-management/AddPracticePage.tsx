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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/content/speaking")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-grayScale-900">Add New Practice</h1>
        </div>
        <Button className="bg-brand-500 hover:bg-brand-600">
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>

      <Card className="p-6">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </Card>

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-grayScale-900">Practice Details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                <label className="mb-2 block text-sm font-medium text-grayScale-700">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2()}
              className="bg-brand-500 hover:bg-brand-600"
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
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Select Participants</h2>
            <div className="grid grid-cols-4 gap-4">
              {mockParticipants.map((participant) => {
                const isSelected = formData.participants.includes(participant.id)
                return (
                  <div
                    key={participant.id}
                    className="relative flex flex-col items-center"
                    onClick={() => toggleParticipant(participant.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-16 w-16 cursor-pointer border-2 border-grayScale-200 transition-all hover:border-brand-500">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-brand-100 text-brand-600">
                          {participant.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <span className="mt-2 text-sm font-medium text-grayScale-700">
                      {participant.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Add Questions Section */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-grayScale-900">
              General Practice Questions
            </h2>

            {/* Existing Questions */}
            {formData.questions.map((q) => (
              <div key={q.id} className="mb-4 rounded-lg border bg-grayScale-50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="font-medium text-grayScale-900">{q.question}</p>
                    <Badge variant="secondary">{q.points} points</Badge>
                  </div>
                <p className="text-sm text-grayScale-600">
                  Type: {q.type} | Correct Answer: {q.correctAnswer}
                </p>
              </div>
            ))}

            {/* Add New Question Form */}
            <div className="space-y-4 rounded-lg border bg-white p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                  <label className="mb-2 block text-sm font-medium text-grayScale-700">Points</label>
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
                  <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                className="w-full bg-brand-500 hover:bg-brand-600"
              >
                <Plus className="h-4 w-4" />
                Add New Question
              </Button>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3()}
              className="bg-brand-500 hover:bg-brand-600"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Practice Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Title:</span>
                <span className="text-sm font-medium text-grayScale-900">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Description:</span>
                <span className="text-sm font-medium text-grayScale-900">
                  {formData.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Category:</span>
                <span className="text-sm font-medium text-grayScale-900">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Difficulty:</span>
                <span className="text-sm font-medium text-grayScale-900">
                  {formData.difficulty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Duration:</span>
                <span className="text-sm font-medium text-grayScale-900">
                  {formData.duration} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-grayScale-600">Tags:</span>
                <span className="text-sm font-medium text-grayScale-900">{formData.tags}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Questions</h2>
            <div className="space-y-4">
              {formData.questions.map((q, index) => (
                <div key={q.id} className="rounded-lg border bg-grayScale-50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-grayScale-900">
                        {index + 1}. {q.question}
                      </p>
                      <p className="mt-1 text-sm text-grayScale-600">
                        Type: {q.type} | Points: {q.points}
                      </p>
                    </div>
                  </div>
                  {q.type === "multiple-choice" && q.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`rounded px-2 py-1 text-sm ${
                            opt === q.correctAnswer
                              ? "bg-brand-100 text-brand-700 font-medium"
                              : "bg-white text-grayScale-600"
                          }`}
                        >
                          {opt}
                          {opt === q.correctAnswer && (
                            <Check className="ml-2 inline h-3 w-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-grayScale-600">
                    Correct Answer: <span className="font-medium">{q.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit} className="bg-brand-500 hover:bg-brand-600">
              Create Practice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

