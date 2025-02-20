;; Funding Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INSUFFICIENT_FUNDS (err u402))

;; Fungible Token Definition
(define-fungible-token research-grant)

;; Data Maps
(define-map grants
  { grant-id: uint }
  {
    project-id: uint,
    amount: uint,
    remaining: uint,
    funder: principal,
    created-at: uint
  }
)

(define-map project-funds
  { project-id: uint }
  { balance: uint }
)

(define-data-var grant-nonce uint u0)

;; Functions
(define-public (create-grant (project-id uint) (amount uint))
  (let
    ((new-grant-id (+ (var-get grant-nonce) u1)))
    (try! (ft-mint? research-grant amount tx-sender))
    (try! (ft-transfer? research-grant amount tx-sender (as-contract tx-sender)))
    (map-set grants
      { grant-id: new-grant-id }
      {
        project-id: project-id,
        amount: amount,
        remaining: amount,
        funder: tx-sender,
        created-at: block-height
      }
    )
    (var-set grant-nonce new-grant-id)
    (ok new-grant-id)
  )
)

(define-public (allocate-funds (project-id uint) (amount uint))
  (let
    ((project-fund (default-to { balance: u0 } (map-get? project-funds { project-id: project-id }))))
    (asserts! (>= (ft-get-balance research-grant (as-contract tx-sender)) amount) ERR_INSUFFICIENT_FUNDS)
    (try! (as-contract (ft-transfer? research-grant amount tx-sender tx-sender)))
    (ok (map-set project-funds
      { project-id: project-id }
      { balance: (+ (get balance project-fund) amount) }
    ))
  )
)

(define-read-only (get-grant (grant-id uint))
  (map-get? grants { grant-id: grant-id })
)

(define-read-only (get-project-funds (project-id uint))
  (default-to { balance: u0 } (map-get? project-funds { project-id: project-id }))
)

(define-read-only (get-contract-balance)
  (ft-get-balance research-grant (as-contract tx-sender))
)

