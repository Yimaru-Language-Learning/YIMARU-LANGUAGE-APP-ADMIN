import { useEffect, useState } from "react"
import { toast } from "sonner"
import { updateInfluencer } from "../../api/influencers.api"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { Textarea } from "../../components/ui/textarea"
import type {
  Influencer,
  InfluencerPlatform,
  InfluencerStatus,
  UpdateInfluencerInput,
} from "../../types/influencer.types"

interface EditInfluencerModalProps {
  influencer: Influencer | null
  open: boolean
  onClose: () => void
  onSuccess: (updated: Influencer) => void
}

const PLATFORM_OPTIONS: { value: InfluencerPlatform; label: string }[] = [
  { value: "TIKTOK", label: "TikTok" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "OTHER", label: "Other / Website" },
]

export function EditInfluencerModal({
  influencer,
  open,
  onClose,
  onSuccess,
}: EditInfluencerModalProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [platform, setPlatform] = useState<InfluencerPlatform>("TIKTOK")
  const [socialHandle, setSocialHandle] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [commissionRate, setCommissionRate] = useState("0")
  const [targetURL, setTargetURL] = useState("")
  const [status, setStatus] = useState<InfluencerStatus>("ACTIVE")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (influencer) {
      setName(influencer.name)
      setCode(influencer.code)
      setPlatform(influencer.platform)
      setSocialHandle(influencer.social_handle ?? "")
      setPhoneNumber(influencer.phone_number ?? "")
      setEmail(influencer.email ?? "")
      setCommissionRate(String(influencer.commission_rate ?? 0))
      setTargetURL(influencer.target_url ?? "")
      setStatus(influencer.status)
      setNotes(influencer.notes ?? "")
    }
  }, [influencer])

  if (!influencer) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Please enter a valid influencer name (at least 2 characters)")
      return
    }

    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode || trimmedCode.length < 3) {
      toast.error("Referral code must be at least 3 alphanumeric characters")
      return
    }

    const commNum = parseFloat(commissionRate)
    if (isNaN(commNum) || commNum < 0 || commNum > 100) {
      toast.error("Commission rate must be between 0.00% and 100.00%")
      return
    }

    const payload: UpdateInfluencerInput = {
      name: trimmedName,
      code: trimmedCode,
      platform,
      social_handle: socialHandle.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      email: email.trim().toLowerCase() || undefined,
      commission_rate: commNum,
      target_url: targetURL.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    }

    try {
      setLoading(true)
      const updated = await updateInfluencer(influencer.id, payload)
      toast.success(`Influencer "${updated.name}" updated successfully!`)
      onSuccess(updated)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string }
      const msg =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to update influencer"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Influencer #{influencer.id}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Referral Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                className="font-mono uppercase tracking-wider"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Platform
              </label>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as InfluencerPlatform)}
                disabled={loading}
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as InfluencerStatus)}
                disabled={loading}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Social Handle
              </label>
              <Input
                placeholder="@handle"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Phone Number
              </label>
              <Input
                placeholder="+251..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="influencer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Commission Rate (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grayScale-700">
                Target URL
              </label>
              <Input
                placeholder="https://..."
                value={targetURL}
                onChange={(e) => setTargetURL(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-grayScale-700">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={loading}
              className="gap-2 bg-brand-500 hover:bg-brand-600 text-white shadow-sm font-medium"
              style={{ backgroundColor: "#9E2891", color: "#ffffff" }}
            >
              {loading && <SpinnerIcon className="h-4 w-4 text-white" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
