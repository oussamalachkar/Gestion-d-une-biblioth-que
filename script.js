// Données initiales
let users = [{ username: "admin", password: "admin" }];
let livres = [
  { titre: "Le Petit Prince", auteur: "Antoine de Saint-Exupéry", favori: true },
  { titre: "1984", auteur: "George Orwell", favori: false },
  { titre: "L'Étranger", auteur: "Albert Camus", favori: false }
];
let currentUser = null;

// DOM Elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const librarySection = document.getElementById("librarySection");
const authSection = document.getElementById("authSection");
const resultContainer = document.getElementById("resultContainer");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("importExportModal");

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  // Vérifier si l'utilisateur est déjà connecté (dans un vrai projet, utiliser des sessions/cookies)
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showLibrary();
  }
  
  // Vérifier le thème
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  
  updateStats();
});

// Fonctions d'authentification
function toggleForms() {
  loginForm.classList.toggle("active");
  signupForm.classList.toggle("active");
}

function login() {
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;
  const found = users.find(u => u.username === user && u.password === pass);

  if (found) {
    currentUser = found;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    showLibrary();
  } else {
    showAlert("Nom d'utilisateur ou mot de passe incorrect.", "error");
  }
}

function signup() {
  const user = document.getElementById("signupUser").value;
  const pass = document.getElementById("signupPass").value;

  if (!user || !pass) {
    showAlert("Veuillez remplir tous les champs.", "error");
    return;
  }

  if (users.some(u => u.username === user)) {
    showAlert("Ce nom d'utilisateur est déjà pris.", "error");
    return;
  }

  users.push({ username: user, password: pass });
  showAlert("Compte créé avec succès !", "success");
  toggleForms();
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  librarySection.classList.add("hidden");
  authSection.classList.remove("hidden");
  loginForm.classList.add("active");
  signupForm.classList.remove("active");
}

function showLibrary() {
  authSection.classList.add("hidden");
  librarySection.classList.remove("hidden");
  afficherLivres(livres);
}

// Fonctions de gestion des livres
function afficherLivres(liste) {
  resultContainer.innerHTML = "";
  
  if (liste.length === 0) {
    resultContainer.innerHTML = '<div class="no-results"><i class="fas fa-book-open"></i><p>Aucun livre trouvé</p></div>';
    return;
  }

  liste.forEach((livre, index) => {
    const livreElement = document.createElement("div");
    livreElement.className = "livre";
    livreElement.innerHTML = `
      <div class="livre-actions">
        <button onclick="toggleFavorite(${index})" class="${livre.favori ? 'favorite' : ''}">
          <i class="fas fa-heart"></i>
        </button>
      </div>
      <h4>${livre.titre}</h4>
      <p>${livre.auteur}</p>
    `;
    resultContainer.appendChild(livreElement);
  });
  
  updateStats();
}

function ajouterLivre() {
  const titre = document.getElementById("newTitle").value.trim();
  const auteur = document.getElementById("newAuthor").value.trim();

  if (!titre || !auteur) {
    showAlert("Veuillez remplir les deux champs.", "error");
    return;
  }

  livres.push({ titre, auteur, favori: false });
  afficherLivres(livres);
  document.getElementById("newTitle").value = "";
  document.getElementById("newAuthor").value = "";
  showAlert("Livre ajouté avec succès !", "success");
}

function supprimerLivre() {
  const titre = document.getElementById("deleteTitle").value.trim().toLowerCase();
  const initialCount = livres.length;
  
  livres = livres.filter(l => l.titre.toLowerCase() !== titre);
  
  if (livres.length < initialCount) {
    showAlert("Livre supprimé avec succès !", "success");
  } else {
    showAlert("Livre non trouvé.", "error");
  }
  
  afficherLivres(livres);
  document.getElementById("deleteTitle").value = "";
}

function toggleFavorite(index) {
  livres[index].favori = !livres[index].favori;
  afficherLivres(livres);
}

// Fonctions de recherche et tri
searchInput.addEventListener("input", () => {
  const motCle = searchInput.value.toLowerCase();
  const resultat = livres.filter(
    l => l.titre.toLowerCase().includes(motCle) || 
         l.auteur.toLowerCase().includes(motCle)
  );
  afficherLivres(resultat);
});

function clearSearch() {
  searchInput.value = "";
  afficherLivres(livres);
}

function trierLivres() {
  const sortValue = document.getElementById("sortSelect").value;
  
  switch (sortValue) {
    case "title-asc":
      livres.sort((a, b) => a.titre.localeCompare(b.titre));
      break;
    case "title-desc":
      livres.sort((a, b) => b.titre.localeCompare(a.titre));
      break;
    case "author-asc":
      livres.sort((a, b) => a.auteur.localeCompare(b.auteur));
      break;
    case "author-desc":
      livres.sort((a, b) => b.auteur.localeCompare(a.auteur));
      break;
  }
  
  afficherLivres(livres);
}

// Fonctions d'import/export
function exporterBibliotheque() {
  const dataStr = JSON.stringify(livres, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  openModal("Exporter la bibliothèque", `
    <p>Exportez votre collection de livres au format JSON.</p>
    <textarea class="export-data" readonly>${dataStr}</textarea>
    <a href="${dataUri}" download="mybookshelf_export.json" class="btn-primary">
      <i class="fas fa-download"></i> Télécharger
    </a>
  `);
}

function importerBibliotheque() {
  openModal("Importer des livres", `
    <p>Importez une collection de livres à partir d'un fichier JSON.</p>
    <input type="file" id="fileInput" accept=".json" class="file-input">
    <button onclick="handleFileImport()" class="btn-primary" style="margin-top: 15px;">
      <i class="fas fa-upload"></i> Importer
    </button>
    <div id="importResult" style="margin-top: 15px;"></div>
  `);
}

function handleFileImport() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  
  if (!file) {
    document.getElementById("importResult").innerHTML = 
      '<p style="color: var(--danger-color)">Veuillez sélectionner un fichier.</p>';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedBooks = JSON.parse(e.target.result);
      
      if (!Array.isArray(importedBooks)) {
        throw new Error("Format invalide");
      }
      
      livres = importedBooks;
      afficherLivres(livres);
      document.getElementById("importResult").innerHTML = 
        '<p style="color: var(--success-color)">Import réussi ! ' + importedBooks.length + ' livres ajoutés.</p>';
    } catch (error) {
      document.getElementById("importResult").innerHTML = 
        '<p style="color: var(--danger-color)">Erreur: Le fichier n\'est pas valide.</p>';
    }
  };
  reader.readAsText(file);
}

// Fonctions utilitaires
function updateStats() {
  document.getElementById("totalBooks").textContent = livres.length;
  
  const authors = new Set(livres.map(l => l.auteur));
  document.getElementById("totalAuthors").textContent = authors.size;
  
  const favorites = livres.filter(l => l.favori).length;
  document.getElementById("totalFavorites").textContent = favorites;
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function openModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalContent").innerHTML = content;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function showAlert(message, type) {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.classList.add("fade-out");
    setTimeout(() => alert.remove(), 500);
  }, 3000);
}

// Style pour les alertes (à ajouter dans le CSS si nécessaire)
const style = document.createElement("style");
style.textContent = `
.alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.alert-success {
  background-color: var(--success-color);
}

.alert-error {
  background-color: var(--danger-color);
}

.fade-out {
  animation: fadeOut 0.5s ease-out forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;
document.head.appendChild(style);