// ===== Panier =====
const cartCountEl = document.querySelector('.cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartOpenBtn = document.getElementById('cart-open');
const cartCloseBtn = document.getElementById('cart-close');
const cartContinueBtn = document.getElementById('cart-continue');
const cartItemsEl = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const cartFooterEl = document.getElementById('cart-footer');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartCheckoutBtn = document.getElementById('cart-checkout');

let cart = JSON.parse(localStorage.getItem('sofiaCart') || '[]');

function cartSave() {
  localStorage.setItem('sofiaCart', JSON.stringify(cart));
}

function cartRender() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = totalQty;

  cartEmptyEl.hidden = cart.length > 0;
  cartFooterEl.hidden = cart.length === 0;

  cartItemsEl.innerHTML = cart.map((item) => `
    <li class="cart-item" data-id="${item.id}">
      <div class="cart-item__image">${item.emoji}</div>
      <div class="cart-item__info">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">${item.price.toFixed(2).replace('.', ',')} €</div>
        <div class="cart-item__qty">
          <button data-action="decrease" aria-label="Diminuer la quantité">−</button>
          <span>${item.qty}</span>
          <button data-action="increase" aria-label="Augmenter la quantité">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-action="remove" aria-label="Retirer l'article">×</button>
    </li>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartSubtotalEl.textContent = `${subtotal.toFixed(2).replace('.', ',')} €`;

  cartSave();
}

function cartAdd({ id, name, price, emoji }) {
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price: Number(price), emoji, qty: 1 });
  }
  cartRender();
}

function cartOpen() {
  cartOverlay.classList.add('active');
}

function cartClose() {
  cartOverlay.classList.remove('active');
}

document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
  btn.addEventListener('click', () => {
    cartAdd({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: btn.dataset.price,
      emoji: btn.dataset.emoji,
    });

    const originalText = btn.textContent;
    btn.textContent = 'Ajouté ✓';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 1200);
  });
});

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.closest('.cart-item').dataset.id;
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  if (btn.dataset.action === 'increase') item.qty++;
  if (btn.dataset.action === 'decrease') item.qty--;
  if (btn.dataset.action === 'remove') item.qty = 0;

  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }
  cartRender();
});

cartOpenBtn.addEventListener('click', cartOpen);
cartCloseBtn.addEventListener('click', cartClose);
cartContinueBtn.addEventListener('click', cartClose);
document.getElementById('cart-empty-cta').addEventListener('click', cartClose);

cartOverlay.addEventListener('click', (e) => {
  if (e.target === cartOverlay) cartClose();
});

cartCheckoutBtn.addEventListener('click', () => {
  cartCheckoutBtn.textContent = 'Commande envoyée ✓ (démo)';
  setTimeout(() => {
    cart = [];
    cartRender();
    cartClose();
    cartCheckoutBtn.textContent = 'Passer la commande';
  }, 1500);
});

cartRender();

// ===== Newsletter (simulation d'inscription) =====
const form = document.getElementById('newsletter-form');
const msg = document.getElementById('newsletter-msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.querySelector('input').value;
  msg.textContent = `Merci ! Un email de confirmation a été envoyé à ${email} 💌`;
  form.reset();
});

// ===== Scroll fluide pour les liens du menu =====
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Quiz d'accueil =====
const quizOverlay = document.getElementById('quiz-overlay');
const quizModal = document.querySelector('.quiz-modal');
const quizProgressBar = document.getElementById('quiz-progress-bar');
const quizSteps = document.querySelectorAll('.quiz-step');
const quizBackBtn = document.getElementById('quiz-back');
const quizCloseBtn = document.getElementById('quiz-close');
const quizReopenBtn = document.getElementById('quiz-reopen');
const quizEmailForm = document.getElementById('quiz-email-form');
const quizSkipEmailBtn = document.getElementById('quiz-skip-email');
const quizCtaBtn = document.getElementById('quiz-cta');
const quizResultText = document.getElementById('quiz-result-text');

const quizAnswers = { profil: null, age: null, priorite: null, email: null };
let quizCurrentStep = 1;
const quizTotalSteps = quizSteps.length;

const quizAgeLabels = {
  ne: 'un tout petit nouveau-né',
  '0-3': 'un bébé de 0 à 3 mois',
  '3-6': 'un bébé de 3 à 6 mois',
  '6-12': 'un bébé de 6 à 12 mois',
  '12+': 'un bébé de plus d\'un an',
};

const quizSizeRecommendation = {
  ne: 'la Taille 1 (2 à 5 kg)',
  '0-3': 'la Taille 1 (2 à 5 kg)',
  '3-6': 'la Taille 2 (4 à 8 kg)',
  '6-12': 'la Taille 2 ou 3 selon son poids',
  '12+': 'la Taille 3 (6 à 10 kg)',
};

const quizPrioriteText = {
  bio: 'nos couches en coton bio, douces et hypoallergéniques',
  prix: 'notre offre d\'abonnement au meilleur rapport qualité-prix',
  eco: 'notre gamme éco-responsable à emballages recyclables',
  nuit: 'notre format absorption 12h pour des nuits sereines',
};

const quizGreeting = {
  futur: 'Félicitations pour cette belle aventure qui arrive ! 🎉',
  jeune: 'Bienvenue dans l\'aventure parentale ! 💛',
  experimente: 'Merci pour votre confiance renouvelée ! 🙏',
  proche: 'Merci de penser à eux avec autant d\'attention ! 💌',
};

function quizShowStep(stepNumber) {
  quizSteps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== stepNumber;
  });
  quizProgressBar.style.width = `${(stepNumber / quizTotalSteps) * 100}%`;
  quizBackBtn.hidden = stepNumber === 1 || stepNumber === quizTotalSteps;
  quizCurrentStep = stepNumber;
}

function quizOpen() {
  quizOverlay.classList.add('active');
}

function quizClose(remember = true) {
  quizOverlay.classList.remove('active');
  if (remember) {
    localStorage.setItem('sofiaQuizDone', '1');
    quizReopenBtn.hidden = false;
  }
}

quizSteps.forEach((step) => {
  const optionsWrap = step.querySelector('.quiz-options');
  if (!optionsWrap) return;
  const question = optionsWrap.dataset.question;

  optionsWrap.querySelectorAll('.quiz-option').forEach((option) => {
    option.addEventListener('click', () => {
      optionsWrap.querySelectorAll('.quiz-option').forEach((o) => o.classList.remove('selected'));
      option.classList.add('selected');
      quizAnswers[question] = option.dataset.value;

      setTimeout(() => {
        quizShowStep(quizCurrentStep + 1);
      }, 350);
    });
  });
});

quizBackBtn.addEventListener('click', () => {
  quizShowStep(quizCurrentStep - 1);
});

quizCloseBtn.addEventListener('click', () => quizClose(true));

quizOverlay.addEventListener('click', (e) => {
  if (e.target === quizOverlay) quizClose(true);
});

function quizBuildResult() {
  const greeting = quizGreeting[quizAnswers.profil] || 'Ravis de vous accueillir !';
  const ageLabel = quizAgeLabels[quizAnswers.age] || 'votre bébé';
  const sizeReco = quizSizeRecommendation[quizAnswers.age] || 'la taille adaptée';
  const prioriteText = quizPrioriteText[quizAnswers.priorite] || 'nos couches douces';

  quizResultText.textContent =
    `${greeting} Pour ${ageLabel}, nous vous recommandons ${sizeReco}. ` +
    `Et comme vous tenez à ${prioriteText}, c'est exactement ce qu'on a préparé pour vous.`;
}

quizEmailForm.addEventListener('submit', (e) => {
  e.preventDefault();
  quizAnswers.email = quizEmailForm.querySelector('input').value;
  quizBuildResult();
  quizShowStep(5);
});

quizSkipEmailBtn.addEventListener('click', () => {
  quizBuildResult();
  quizShowStep(5);
});

quizCtaBtn.addEventListener('click', () => {
  quizClose(true);
  const target = document.querySelector('#produits');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
});

quizReopenBtn.addEventListener('click', () => {
  quizShowStep(1);
  quizOpen();
});

// Ouverture automatique à l'arrivée sur le site (une seule fois)
if (!localStorage.getItem('sofiaQuizDone')) {
  setTimeout(quizOpen, 600);
} else {
  quizReopenBtn.hidden = false;
}
