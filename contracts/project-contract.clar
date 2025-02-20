;; Project Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_STATUS (err u400))

;; Define project statuses
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_COMPLETED u2)
(define-constant STATUS_CANCELLED u3)

;; Data Maps
(define-map projects
  { project-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 1000),
    principal-investigator: principal,
    status: uint,
    created-at: uint,
    updated-at: uint
  }
)

(define-map project-milestones
  { project-id: uint, milestone-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 500),
    due-date: uint,
    completed: bool
  }
)

(define-data-var project-nonce uint u0)
(define-data-var milestone-nonce uint u0)

;; Functions
(define-public (create-project (title (string-ascii 100)) (description (string-utf8 1000)))
  (let
    ((new-project-id (+ (var-get project-nonce) u1)))
    (map-set projects
      { project-id: new-project-id }
      {
        title: title,
        description: description,
        principal-investigator: tx-sender,
        status: STATUS_ACTIVE,
        created-at: block-height,
        updated-at: block-height
      }
    )
    (var-set project-nonce new-project-id)
    (ok new-project-id)
  )
)

(define-public (update-project-status (project-id uint) (new-status uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get principal-investigator project)) ERR_NOT_AUTHORIZED)
    (asserts! (or (is-eq new-status STATUS_COMPLETED) (is-eq new-status STATUS_CANCELLED)) ERR_INVALID_STATUS)
    (ok (map-set projects
      { project-id: project-id }
      (merge project {
        status: new-status,
        updated-at: block-height
      })
    ))
  )
)

(define-public (add-milestone (project-id uint) (title (string-ascii 100)) (description (string-utf8 500)) (due-date uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) ERR_NOT_FOUND))
     (new-milestone-id (+ (var-get milestone-nonce) u1)))
    (asserts! (is-eq tx-sender (get principal-investigator project)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status project) STATUS_ACTIVE) ERR_INVALID_STATUS)
    (map-set project-milestones
      { project-id: project-id, milestone-id: new-milestone-id }
      {
        title: title,
        description: description,
        due-date: due-date,
        completed: false
      }
    )
    (var-set milestone-nonce new-milestone-id)
    (ok new-milestone-id)
  )
)

(define-public (complete-milestone (project-id uint) (milestone-id uint))
  (let
    ((project (unwrap! (map-get? projects { project-id: project-id }) ERR_NOT_FOUND))
     (milestone (unwrap! (map-get? project-milestones { project-id: project-id, milestone-id: milestone-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get principal-investigator project)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status project) STATUS_ACTIVE) ERR_INVALID_STATUS)
    (ok (map-set project-milestones
      { project-id: project-id, milestone-id: milestone-id }
      (merge milestone { completed: true })
    ))
  )
)

(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-project-milestone (project-id uint) (milestone-id uint))
  (map-get? project-milestones { project-id: project-id, milestone-id: milestone-id })
)

