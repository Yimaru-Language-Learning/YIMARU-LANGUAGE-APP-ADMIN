import { useState, useEffect, useRef } from "react"
import { BrandLogo } from "../../components/brand/BrandLogo"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

export function VerificationPage() {
  const [codes, setCodes] = useState<string[]>(["", "", "", "", ""])
  const [activeIndex, setActiveIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCodes = value.slice(0, 5).split("")
      const newCodes = [...codes]
      pastedCodes.forEach((code, i) => {
        if (index + i < 5) {
          newCodes[index + i] = code
        }
      })
      setCodes(newCodes)
      const nextIndex = Math.min(index + pastedCodes.length, 4)
      setActiveIndex(nextIndex)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return // Only allow digits

    const newCodes = [...codes]
    newCodes[index] = value
    setCodes(newCodes)

    if (value && index < 4) {
      setActiveIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    } else if (!value && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const code = codes.join("")
    if (code.length === 5) {
      // Handle verification logic here
      console.log("Verification code:", code)
    }
  }

  const handleResend = () => {
    if (timeLeft === 0) {
      setTimeLeft(30)
      setCodes(["", "", "", "", ""])
      setActiveIndex(0)
      inputRefs.current[0]?.focus()
      // Handle resend logic here
      console.log("Resending code...")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto bg-grayScale-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <div className="mb-8">
            <BrandLogo />
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold text-grayScale-600">Verification Code</h1>
            <p className="text-sm text-grayScale-400">
              We have sent a verification code sent to your email address ******230@gmail.com
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-3">
              {codes.map((code, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => setActiveIndex(index)}
                  className={`h-14 w-14 text-center text-xl font-semibold ${
                    activeIndex === index
                      ? "border-2 border-brand-500 ring-2 ring-brand-500/20"
                      : ""
                  }`}
                />
              ))}
            </div>

            <div className="text-center text-sm text-grayScale-400">
              Resend code in {formatTime(timeLeft)}
            </div>

            <Button type="submit" className="w-full" disabled={codes.join("").length !== 5}>
              Verify
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={timeLeft > 0}
                className={`text-sm font-medium ${
                  timeLeft > 0
                    ? "text-grayScale-400 cursor-not-allowed"
                    : "text-brand-500 hover:text-brand-600"
                }`}
              >
                Send Again
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

