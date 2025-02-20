import { describe, it, expect, beforeEach } from "vitest"

describe("Project Contract", () => {
  let mockStorage: Map<string, any>
  let projectNonce: number
  let milestoneNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    projectNonce = 0
    milestoneNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-project":
        const [title, description] = args
        projectNonce++
        mockStorage.set(`project-${projectNonce}`, {
          title,
          description,
          "principal-investigator": sender,
          status: 1, // STATUS_ACTIVE
          "created-at": 100,
          "updated-at": 100,
        })
        return { success: true, value: projectNonce }
      case "update-project-status":
        const [projectId, newStatus] = args
        const project = mockStorage.get(`project-${projectId}`)
        if (!project || project["principal-investigator"] !== sender) {
          return { success: false, error: "Not authorized or project not found" }
        }
        project.status = newStatus
        project["updated-at"] = 101
        mockStorage.set(`project-${projectId}`, project)
        return { success: true }
      case "add-milestone":
        const [milestoneProjectId, milestoneTitle, milestoneDescription, dueDate] = args
        const milestoneProject = mockStorage.get(`project-${milestoneProjectId}`)
        if (
            !milestoneProject ||
            milestoneProject["principal-investigator"] !== sender ||
            milestoneProject.status !== 1
        ) {
          return { success: false, error: "Not authorized or invalid project" }
        }
        milestoneNonce++
        mockStorage.set(`milestone-${milestoneProjectId}-${milestoneNonce}`, {
          title: milestoneTitle,
          description: milestoneDescription,
          "due-date": dueDate,
          completed: false,
        })
        return { success: true, value: milestoneNonce }
      case "complete-milestone":
        const [completeMilestoneProjectId, completeMilestoneId] = args
        const completeMilestoneProject = mockStorage.get(`project-${completeMilestoneProjectId}`)
        const milestone = mockStorage.get(`milestone-${completeMilestoneProjectId}-${completeMilestoneId}`)
        if (
            !completeMilestoneProject ||
            completeMilestoneProject["principal-investigator"] !== sender ||
            completeMilestoneProject.status !== 1 ||
            !milestone
        ) {
          return { success: false, error: "Not authorized or invalid project/milestone" }
        }
        milestone.completed = true
        mockStorage.set(`milestone-${completeMilestoneProjectId}-${completeMilestoneId}`, milestone)
        return { success: true }
      case "get-project":
        return { success: true, value: mockStorage.get(`project-${args[0]}`) }
      case "get-project-milestone":
        return { success: true, value: mockStorage.get(`milestone-${args[0]}-${args[1]}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should create a project", () => {
    const result = mockContractCall(
        "create-project",
        ["Research Project 1", "Description of Research Project 1"],
        "user1",
    )
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should update project status", () => {
    mockContractCall("create-project", ["Research Project 1", "Description of Research Project 1"], "user1")
    const result = mockContractCall("update-project-status", [1, 2], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should add a milestone", () => {
    mockContractCall("create-project", ["Research Project 1", "Description of Research Project 1"], "user1")
    const result = mockContractCall("add-milestone", [1, "Milestone 1", "Description of Milestone 1", 200], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should complete a milestone", () => {
    mockContractCall("create-project", ["Research Project 1", "Description of Research Project 1"], "user1")
    mockContractCall("add-milestone", [1, "Milestone 1", "Description of Milestone 1", 200], "user1")
    const result = mockContractCall("complete-milestone", [1, 1], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should get project details", () => {
    mockContractCall("create-project", ["Research Project 1", "Description of Research Project 1"], "user1")
    const result = mockContractCall("get-project", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.title).toBe("Research Project 1")
  })
  
  it("should get project milestone details", () => {
    mockContractCall("create-project", ["Research Project 1", "Description of Research Project 1"], "user1")
    mockContractCall("add-milestone", [1, "Milestone 1", "Description of Milestone 1", 200], "user1")
    const result = mockContractCall("get-project-milestone", [1, 1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.title).toBe("Milestone 1")
  })
})

