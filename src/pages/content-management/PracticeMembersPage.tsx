import { useState } from "react"
import { Plus } from "lucide-react"
import { PageBackLink } from "../../components/navigation/PageBackLink"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"

const mockMembers = [
  { id: "1", name: "John", avatar: "" },
  { id: "2", name: "Jane", avatar: "" },
  { id: "3", name: "Mike", avatar: "" },
  { id: "4", name: "Sarah", avatar: "" },
  { id: "5", name: "David", avatar: "" },
  { id: "6", name: "Emily", avatar: "" },
]

export function PracticeMembersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")

  const handleAddMember = () => {
    console.log("Add member:", { memberName, memberRole })
    setIsModalOpen(false)
    setMemberName("")
    setMemberRole("")
  }

  return (
    <div className="space-y-8">
      <PageBackLink fallbackTo="/content/practices" label="Back to Practice Management" />
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Practice Management</h1>
        <p className="mt-1 text-sm text-grayScale-400">View and manage your practice members</p>
      </div>

      <Card className="border-grayScale-200 p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-grayScale-600">Current Members</h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Members
          </Button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {mockMembers.map((member) => (
            <div
              key={member.id}
              className="group flex flex-col items-center"
            >
              <Avatar className="h-16 w-16 border-2 border-grayScale-200 transition-all duration-200 group-hover:border-brand-400 group-hover:shadow-md group-hover:scale-105">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="bg-brand-100 text-brand-600 font-medium">
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="mt-2.5 text-sm font-medium text-grayScale-500 transition-colors group-hover:text-grayScale-600">
                {member.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
