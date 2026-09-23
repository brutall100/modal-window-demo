const root = document.documentElement
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

/* ---------- Theme toggle ---------- */
const themeToggle = document.getElementById('theme-toggle')

function currentTheme() {
  return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light')
}

function updateToggleLabel() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  themeToggle.setAttribute('aria-label', `Switch to ${next} theme`)
}

themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  root.setAttribute('data-theme', next)
  try {
    localStorage.setItem('theme', next)
  } catch (e) {
    // Storage is blocked, the choice lasts only for this visit.
  }
  updateToggleLabel()
})

systemDark.addEventListener('change', updateToggleLabel)
updateToggleLabel()

/* ---------- Modals ---------- */
let lastTrigger = null

function openModal(modal, trigger) {
  lastTrigger = trigger
  modal.classList.remove('is-closing')
  modal.showModal()
}

function closeModal(modal) {
  if (!modal.open || modal.classList.contains('is-closing')) return

  if (reduceMotion.matches) {
    modal.close()
    return
  }

  // Play the closing animation first, then really close
  modal.classList.add('is-closing')
  modal.addEventListener('animationend', function onEnd(event) {
    // Ignore animations of children (for example the button ripple)
    if (event.target !== modal || event.animationName !== 'modal-out') return
    modal.removeEventListener('animationend', onEnd)
    modal.classList.remove('is-closing')
    modal.close()
  })
}

document.querySelectorAll('[data-open]').forEach((button) => {
  const modal = document.getElementById(button.dataset.open)
  button.addEventListener('click', () => openModal(modal, button))
})

document.querySelectorAll('dialog.modal').forEach((modal) => {
  // Buttons inside the modal that close it
  modal.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      closeModal(modal)
      if (button.dataset.toast) showToast(button.dataset.toast)
    })
  })

  // A click on the dialog element itself is a click on the backdrop
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal)
  })

  // Esc: use our animated close instead of the instant one
  modal.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeModal(modal)
  })

  // Give the focus back to the button that opened the modal
  modal.addEventListener('close', () => {
    if (lastTrigger) lastTrigger.focus()
  })
})

/* ---------- Newsletter form (demo only, nothing is sent) ---------- */
const form = document.getElementById('signup-form')
const emailInput = document.getElementById('signup-email')
const formError = document.getElementById('signup-error')

form.addEventListener('submit', (event) => {
  event.preventDefault()

  if (!emailInput.validity.valid) {
    formError.textContent = emailInput.validity.valueMissing
      ? 'Please type your email address.'
      : 'That does not look like an email address.'
    emailInput.setAttribute('aria-invalid', 'true')
    emailInput.focus()
    return
  }

  formError.textContent = ''
  emailInput.removeAttribute('aria-invalid')
  form.reset()
  closeModal(document.getElementById('modal-form'))
  showToast('You are on the list! (Demo, nothing was sent.)')
})

emailInput.addEventListener('input', () => {
  if (emailInput.validity.valid) {
    formError.textContent = ''
    emailInput.removeAttribute('aria-invalid')
  }
})

/* ---------- Toast ---------- */
const toast = document.getElementById('toast')
let toastTimer

function showToast(message) {
  toast.textContent = message
  toast.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200)
}

/* ---------- Ripple on every button ---------- */
document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    if (reduceMotion.matches) return
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.left = `${event.clientX - rect.left}px`
    ripple.style.top = `${event.clientY - rect.top}px`
    button.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
  })
})

/* ---------- Count-up numbers ---------- */
function countUp(element) {
  const target = Number(element.dataset.count)
  const suffix = element.dataset.suffix || ''
  const duration = 1200
  const start = performance.now()

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    element.textContent = Math.round(target * eased) + suffix
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

/* ---------- Reveal on scroll ---------- */
const revealItems = document.querySelectorAll('.reveal')

if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'))
} else {
  // Small stagger for items in the same group
  document.querySelectorAll('.stats, .cards, .steps').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((item, index) => {
      item.style.setProperty('--delay', `${index * 0.1}s`)
    })
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      // Drop the stagger delay afterwards so hover effects react at once
      setTimeout(() => entry.target.style.removeProperty('--delay'), 1000)
      const number = entry.target.querySelector('[data-count]')
      if (number) countUp(number)
      observer.unobserve(entry.target)
    })
  }, { threshold: 0.2 })

  revealItems.forEach((item) => observer.observe(item))
}
