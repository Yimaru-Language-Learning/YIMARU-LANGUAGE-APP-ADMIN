import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"

const mockLeaders = [
  { id: "1", name: "John Doe", role: "CEO" },
  { id: "2", name: "Jane Smith", role: "COO" },
]

const mockMembers = [
  { id: "1", name: "John Doe", role: "Member" },
  { id: "2", name: "Jane Smith", role: "Member" },
]

export function PracticeDetailsPage() {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [leaderName, setLeaderName] = useState("")
  const [leaderRole, setLeaderRole] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const handleAddMember = () => {
    console.log("Add member:", { memberName, memberRole })
    setIsMemberModalOpen(false)
    setMemberName("")
    setMemberRole("")
  }

  const handleAddLeader = () => {
    console.log("Add leader:", { leaderName, leaderRole })
    setIsLeaderModalOpen(false)
    setLeaderName("")
    setLeaderRole("")
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Practice Management</h1>
        <p className="mt-1 text-sm text-grayScale-400">Manage your practice details, leadership, and members</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Practice Leadership */}
        <Card className="border-grayScale-200 p-6 shadow-sm">
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-grayScale-600">Practice Leadership</h2>
            <Button
              size="sm"
              onClick={() => setIsLeaderModalOpen(true)}
              className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add New Leader
            </Button>
          </div>
          <div className="space-y-2">
            {mockLeaders.map((leader) => (
              <div
                key={leader.id}
                className="group flex items-center justify-between rounded-xl border border-grayScale-200 p-3.5 transition-all hover:border-grayScale-300 hover:bg-grayScale-50/50 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                    {leader.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-grayScale-600">{leader.name}</p>
                    <p className="text-xs text-grayScale-400">{leader.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-grayScale-400 hover:text-grayScale-600">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-grayScale-400 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Practice Details */}
        <Card className="border-grayScale-200 p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-grayScale-600">Practice Details</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Practice Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter practice name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Practice Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter practice description"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Practice Type
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select practice type</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Practice Address
              </label>
              <div className="space-y-2">
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="Zip Code"
                />
              </div>
            </div>

            <Button className="w-full bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors">
              Save Changes
            </Button>
          </div>
        </Card>
      </div>

      {/* Practice Members */}
      <Card className="border-grayScale-200 p-6 shadow-sm">
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-grayScale-600">Practice Members</h2>
          <Button
            size="sm"
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Member
          </Button>
        </div>
        <div className="space-y-2">
          {mockMembers.map((member) => (
            <div
              key={member.id}
              className="group flex items-center justify-between rounded-xl border border-grayScale-200 p-3.5 transition-all hover:border-grayScale-300 hover:bg-grayScale-50/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                  {member.name[0]}
                </div>
                <div>
                  <p className="font-medium text-grayScale-600">{member.name}</p>
                  <p className="text-xs text-grayScale-400">{member.role}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-grayScale-400 hover:text-grayScale-600">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-grayScale-400 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Member Name
              </label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter member name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Member Role
              </label>
              <Input
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="Enter member role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leader Modal */}
      <Dialog open={isLeaderModalOpen} onOpenChange={setIsLeaderModalOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Add New Leader</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Leader Name
              </label>
              <Input
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="Enter leader name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Leader Role
              </label>
              <Input
                value={leaderRole}
                onChange={(e) => setLeaderRole(e.target.value)}
                placeholder="Enter leader role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeader} className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors">
              Add Leader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
