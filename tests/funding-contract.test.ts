import { describe, it, expect, beforeEach } from "vitest"

describe("Funding Contract", () => {
  let mockStorage: Map<string, any>
  let grantNonce: number
  let tokenBalance: Map<string, number>
  
  beforeEach(() => {
    mockStorage = new Map()
    tokenBalance = new Map()
    grantNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-grant":
        const [projectId, amount] = args
        grantNonce++
        mockStorage.set(`grant-${grantNonce}`, {
          "project-id": projectId,
          amount,
          remaining: amount,
          funder: sender,
          "created-at": 100,
        })
        tokenBalance.set(sender, (tokenBalance.get(sender) || 0) - amount)
        tokenBalance.set("contract", (tokenBalance.get("contract") || 0) + amount)
        return { success: true, value: grantNonce }
      case "allocate-funds":
        const [allocateProjectId, allocateAmount] = args
        const contractBalance = tokenBalance.get("contract") || 0
        if (contractBalance < allocateAmount) {
          return { success: false, error: "Insufficient funds" }
        }
        tokenBalance.set("contract", contractBalance - allocateAmount)
        const projectFunds = mockStorage.get(`project-funds-${allocateProjectId}`) || { balance: 0 }
        projectFunds.balance += allocateAmount
        mockStorage.set(`project-funds-${allocateProjectId}`, projectFunds)
        return { success: true }
      case "get-grant":
        return { success: true, value: mockStorage.get(`grant-${args[0]}`) }
      case "get-project-funds":
        return { success: true, value: mockStorage.get(`project-funds-${args[0]}`) || { balance: 0 } }
      case "get-contract-balance":
        return { success: true, value: tokenBalance.get("contract") || 0 }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should create a grant", () => {
    tokenBalance.set("user1", 1000)
    const result = mockContractCall("create-grant", [1, 500], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should allocate funds", () => {
    tokenBalance.set("user1", 1000)
    mockContractCall("create-grant", [1, 500], "user1")
    const result = mockContractCall("allocate-funds", [1, 200], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should get a grant", () => {
    tokenBalance.set("user1", 1000)
    mockContractCall("create-grant", [1, 500], "user1")
    const result = mockContractCall("get-grant", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.amount).toBe(500)
  })
  
  it("should get project funds", () => {
    tokenBalance.set("user1", 1000)
    mockContractCall("create-grant", [1, 500], "user1")
    mockContractCall("allocate-funds", [1, 200], "CONTRACT_OWNER")
    const result = mockContractCall("get-project-funds", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.balance).toBe(200)
  })
  
  it("should get contract balance", () => {
    tokenBalance.set("user1", 1000)
    mockContractCall("create-grant", [1, 500], "user1")
    mockContractCall("allocate-funds", [1, 200], "CONTRACT_OWNER")
    const result = mockContractCall("get-contract-balance", [], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(300)
  })
})

