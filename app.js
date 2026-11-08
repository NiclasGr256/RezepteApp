// HTML beschreibt die Seite, CSS gestaltet sie und JavaScript macht sie interaktiv.
const storageKey = 'mein-rezeptbuch-v1';
const form = document.querySelector('#recipe-form');
const search = document.querySelector('#search');
const recipeList = document.querySelector('#recipes');
const status = document.querySelector('#status');
let recipes = [];
let storageReady = true;
let editingRecipe = null;
let currentPhoto = '';
let photoVersion = 0;
let activeUser = null;
let accountVersion = 0;
let cloudReady = false;
let cloudBusy = false;
let newRecipeId = null;
const photoInput = document.querySelector('#photo');
const preview = document.querySelector('#photo-preview');
const removePhoto = document.querySelector('#remove-photo');
const saveButton = document.querySelector('#save-recipe');
const cancelEdit = document.querySelector('#cancel-edit');
const formStatus = document.querySelector('#form-status');
const labelGroups = [
  ['Mahlzeit', ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack']],
  ['Gericht', ['Suppe', 'Salat', 'Hauptgericht', 'Dessert', 'Backen']],
  ['Aufwand', ['Schnell (bis 30 Min.)', 'Einfach']],
  ['Ernährung', ['Vegetarisch', 'Vegan']]
];
const allowedLabels = new Set(labelGroups.flatMap(([, labels]) => labels));
const selectedFilters = new Set();
const labelInputs = new Map();
const filterInputs = new Map();
const resetFilters = document.querySelector('#reset-filters');
const loginForm = document.querySelector('#login-form');
const loginButton = loginForm.querySelector('button');
const accountStatus = document.querySelector('#account-status');
const retryCloud = document.querySelector('#retry-cloud');
const importLocal = document.querySelector('#import-local');
const exportLocal = document.querySelector('#export-local');
const importFile = document.querySelector('#import-file');
const logout = document.querySelector('#logout');
const storageNote = document.querySelector('#storage-note');

// Ältere Rezepte ohne Labels bleiben ganz normal nutzbar.
function getLabels(recipe) {
  return Array.isArray(recipe.labels)
    ? [...new Set(recipe.labels.filter(label => allowedLabels.has(label)))] : [];
}

function buildLabelChoices(container, prefix, inputs, isFilter) {
  labelGroups.forEach(([groupName, labels], groupIndex) => {
    const group = element('fieldset', undefined, 'label-group');
    group.append(element('legend', groupName));
    const choices = element('div', undefined, 'label-choices');
    labels.forEach((label, labelIndex) => {
      const wrapper = element('label', undefined, 'label-choice');
      const checkbox = element('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${prefix}-${groupIndex}-${labelIndex}`;
      checkbox.value = label;
      inputs.set(label, checkbox);
      wrapper.append(checkbox, element('span', label));
      choices.append(wrapper);
      if (isFilter) checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedFilters.add(label);
        else selectedFilters.delete(label);
        renderRecipes();
      });
    });
    group.append(choices);
    container.append(group);
  });
}

function clearFilters() {
  search.value = '';
  selectedFilters.clear();
  filterInputs.forEach(input => { input.checked = false; });
}

buildLabelChoices(document.querySelector('#recipe-labels'), 'recipe-label', labelInputs, false);
buildLabelChoices(document.querySelector('#label-filters'), 'filter-label', filterInputs, true);
resetFilters.addEventListener('click', () => {
  clearFilters();
  renderRecipes();
  search.focus();
});

function showPhoto() {
  preview.hidden = !currentPhoto;
  removePhoto.hidden = !currentPhoto;
  if (currentPhoto) preview.src = currentPhoto;
  else preview.removeAttribute('src');
}

function resetEditor() {
  photoVersion++;
  editingRecipe = null;
  newRecipeId = null;
  currentPhoto = '';
  form.reset();
  showPhoto();
  saveButton.disabled = false;
  saveButton.textContent = '+ Rezept speichern';
  document.querySelector('#form-title').textContent = 'Neues Rezept';
  cancelEdit.hidden = true;
  formStatus.textContent = '';
}

function persist(updated) {
  if (!storageReady) {
    formStatus.textContent = 'Der Browserspeicher ist nicht verfügbar. Vorhandene Daten werden nicht überschrieben.';
    return false;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    recipes = updated;
    return true;
  } catch {
    formStatus.textContent = 'Speichern fehlgeschlagen: Der Browserspeicher ist voll oder gesperrt. Entferne gegebenenfalls das Foto und versuche es erneut. Deine Eingaben bleiben erhalten.';
    return false;
  }
}

// Bilder vor dem Speichern verkleinern, damit sie weniger Browserplatz brauchen.
photoInput.addEventListener('change', async () => {
  const version = ++photoVersion;
  const file = photoInput.files[0];
  if (!file) { saveButton.disabled = false; return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    formStatus.textContent = 'Bitte wähle ein JPG-, PNG- oder WebP-Foto mit höchstens 15 MB.';
    photoInput.value = '';
    saveButton.disabled = false;
    return;
  }
  saveButton.disabled = true;
  formStatus.textContent = 'Foto wird vorbereitet …';
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    if (version !== photoVersion) return;
    const scale = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    currentPhoto = canvas.toDataURL('image/jpeg', 0.78);
    showPhoto();
    formStatus.textContent = 'Foto ist bereit. Speichere das Rezept, um es zu übernehmen.';
  } catch {
    if (version === photoVersion) formStatus.textContent = 'Dieses Foto konnte nicht geöffnet werden. Bitte wähle ein anderes Bild.';
  } finally {
    URL.revokeObjectURL(url);
    if (version === photoVersion) {
      saveButton.disabled = false;
      photoInput.value = '';
    }
  }
});

removePhoto.addEventListener('click', () => {
  photoVersion++;
  currentPhoto = '';
  photoInput.value = '';
  saveButton.disabled = false;
  showPhoto();
  formStatus.textContent = 'Foto entfernt. Speichere das Rezept, um die Änderung zu übernehmen.';
});
cancelEdit.addEventListener('click', resetEditor);

function isRecipeList(saved) {
  return Array.isArray(saved) && saved.every(recipe =>
    recipe && typeof recipe.title === 'string' &&
    typeof recipe.ingredients === 'string' && typeof recipe.instructions === 'string');
}

function readLocalRecipes() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!isRecipeList(saved)) throw new Error('Ungültige Rezeptdaten');
    storageReady = true;
    return saved;
  } catch {
    storageReady = false;
    return [];
  }
}

function showLocalRecipes() {
  recipes = readLocalRecipes();
  if (!storageReady) status.textContent = 'Die lokalen Rezepte konnten nicht gelesen werden. Vorhandene Daten werden nicht überschrieben.';
}

// textContent zeigt Eingaben sicher als Text an.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderRecipes() {
  exportLocal.hidden = Boolean(activeUser) || recipes.length === 0;
  const query = search.value.trim().toLocaleLowerCase('de');
  const hasFilters = Boolean(query || selectedFilters.size);
  const filtered = recipes.filter(recipe => recipe.title.toLocaleLowerCase('de').includes(query) &&
    [...selectedFilters].every(label => getLabels(recipe).includes(label)));
  resetFilters.hidden = !hasFilters;
  document.querySelector('#filter-results').textContent = `${filtered.length} von ${recipes.length} Rezepten angezeigt`;
  document.querySelector('#count').textContent = `${recipes.length} ${recipes.length === 1 ? 'Rezept' : 'Rezepte'}`;
  recipeList.replaceChildren();
  if (filtered.length === 0) {
    const empty = element('div', undefined, 'empty');
    const icon = element('div', '♧', 'empty-icon');
    icon.setAttribute('aria-hidden', 'true');
    empty.append(icon, element('h3', hasFilters ? 'Kein Rezept gefunden' : 'Hier beginnt deine Sammlung'),
      element('p', hasFilters ? 'Versuche einen anderen Namen oder setze die Filter zurück. Ältere Rezepte kannst du über „Bearbeiten“ mit Labels versehen.' : 'Trage dein erstes Lieblingsrezept ins Formular ein. Danach findest du es genau hier.'));
    recipeList.append(empty);
    return;
  }
  for (const [recipeIndex, recipe] of filtered.entries()) {
    const card = element('details');
    const content = element('div', undefined, 'recipe-content');
    if (typeof recipe.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(recipe.photo)) {
      const photo = element('img', undefined, 'recipe-photo');
      photo.src = recipe.photo;
      photo.alt = `Foto: ${recipe.title}`;
      photo.loading = 'lazy';
      content.append(photo);
    }
    const ingredients = element('ul');
    const originalServings = validServings(recipe.servings) ? recipe.servings : null;
    const portions = element('div', undefined, 'portions-control');
    const portionsLabel = element('label', 'Kochen für … Portionen');
    const portionsInput = element('input');
    portionsInput.id = `desired-servings-${recipeIndex}`;
    portionsLabel.htmlFor = portionsInput.id;
    portionsInput.type = 'number';
    portionsInput.min = '1';
    portionsInput.max = '1000';
    portionsInput.step = '1';
    portionsInput.value = originalServings ?? '';
    portionsInput.disabled = !originalServings;
    const portionsNote = element('p', originalServings
      ? `Originalrezept: ${originalServings} Portionen. Die gespeicherten Mengen bleiben unverändert.`
      : 'Die ursprüngliche Portionszahl fehlt. Bitte trage sie über „Bearbeiten“ ein.', 'storage-note');
    const calculationStatus = element('p', undefined, 'storage-note');
    calculationStatus.id = `portions-status-${recipeIndex}`;
    calculationStatus.setAttribute('role', 'status');
    portionsInput.setAttribute('aria-describedby', calculationStatus.id);
    const lines = recipe.ingredients.split('\n').filter(line => line.trim());
    function updateIngredients() {
      const desired = portionsInput.valueAsNumber;
      const valid = Boolean(originalServings && validServings(desired));
      portionsInput.setAttribute('aria-invalid', String(Boolean(originalServings && !valid)));
      let unchanged = 0;
      ingredients.replaceChildren();
      lines.forEach(line => {
        const result = valid ? scaleIngredient(line, originalServings, desired) : { text: line, scaled: false };
        if (!result.scaled) unchanged++;
        ingredients.append(element('li', result.text));
      });
      calculationStatus.textContent = !originalServings ? 'Zutaten in Originalmengen.'
        : !valid ? 'Bitte gib eine ganze Portionszahl von 1 bis 1000 ein. Bis dahin werden die Originalmengen angezeigt.'
        : `${desired} Portionen: Mengen gegebenenfalls gerundet.${unchanged ? ` ${unchanged} Zutatenzeile(n) ohne eindeutige Menge bleiben unverändert.` : ''}`;
    }
    portionsInput.addEventListener('input', updateIngredients);
    updateIngredients();
    portions.append(portionsLabel, portionsInput, portionsNote, calculationStatus);
    content.append(portions, element('h3', 'Zutaten'), ingredients,
      element('p', 'Es wird nur die Menge am Zeilenanfang umgerechnet. Angaben wie „Salz nach Geschmack“, Mengenbereiche und Zahlen in der Zubereitung bleiben unverändert. Bruchteile von Eiern oder Packungen bitte praktisch anpassen.', 'storage-note'),
      element('h3', 'Zubereitung'), element('p', recipe.instructions, 'instructions'));
    const actions = element('div', undefined, 'recipe-actions');
    const edit = element('button', 'Bearbeiten', 'secondary');
    edit.type = 'button';
    edit.addEventListener('click', () => {
      const hasDraft = editingRecipe || currentPhoto || saveButton.disabled ||
        [...labelInputs.values()].some(input => input.checked) ||
        form.elements.servings.value !== form.elements.servings.defaultValue ||
        [form.elements.title, form.elements.ingredients, form.elements.instructions].some(field => field.value.trim());
      if (hasDraft && !window.confirm('Aktuelle Eingaben verwerfen und dieses Rezept bearbeiten?')) return;
      resetEditor();
      editingRecipe = recipe;
      form.elements.title.value = recipe.title;
      form.elements.ingredients.value = recipe.ingredients;
      form.elements.instructions.value = recipe.instructions;
      form.elements.servings.value = validServings(recipe.servings) ? recipe.servings : '';
      const labels = getLabels(recipe);
      labelInputs.forEach((input, label) => { input.checked = labels.includes(label); });
      currentPhoto = typeof recipe.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(recipe.photo) ? recipe.photo : '';
      showPhoto();
      document.querySelector('#form-title').textContent = 'Rezept bearbeiten';
      saveButton.textContent = 'Änderungen speichern';
      cancelEdit.hidden = false;
      form.elements.title.focus();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const remove = element('button', 'Löschen', 'danger');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`„${recipe.title}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
      if (activeUser) {
        if (!await cloudWrite(userId => deleteCloudRecipe(userId, recipe.id), status,
          'Das Rezept konnte nicht gelöscht werden. Bitte versuche es erneut.')) return;
        recipes = recipes.filter(item => item !== recipe);
      } else if (!persist(recipes.filter(item => item !== recipe))) return;
      if (editingRecipe === recipe) resetEditor();
      renderRecipes();
      status.textContent = `„${recipe.title}“ wurde gelöscht.`;
      search.focus();
    });
    actions.append(edit, remove);
    content.append(actions);
    const summary = element('summary');
    summary.append(element('span', recipe.title));
    const labels = getLabels(recipe);
    if (labels.length) {
      const badges = element('span', undefined, 'recipe-label-badges');
      labels.forEach(label => badges.append(element('span', label, 'recipe-label-badge')));
      summary.append(badges);
    }
    card.append(summary, content);
    recipeList.append(card);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (saveButton.disabled) return;
  if (!activeUser && !storageReady) {
    status.textContent = 'Speichern ist momentan nicht möglich, damit vorhandene Daten erhalten bleiben.';
    return;
  }
  const recipe = {
    title: form.elements.title.value.trim(),
    ingredients: form.elements.ingredients.value.trim(),
    instructions: form.elements.instructions.value.trim(),
    photo: currentPhoto,
    servings: form.elements.servings.valueAsNumber,
    labels: [...labelInputs].filter(([, input]) => input.checked).map(([label]) => label)
  };
  if (!validServings(recipe.servings)) {
    formStatus.textContent = 'Bitte gib die ursprüngliche Portionszahl als ganze Zahl von 1 bis 1000 ein.';
    form.elements.servings.focus();
    return;
  }
  if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
    formStatus.textContent = 'Bitte fülle alle drei Felder aus. Leerzeichen allein reichen nicht.';
    return;
  }
  if (activeUser) {
    recipe.id = editingRecipe?.id ?? (newRecipeId ??= crypto.randomUUID());
    const isEdit = Boolean(editingRecipe);
    if (!await cloudWrite(userId => saveCloudRecipe(userId, recipe, isEdit), formStatus,
      'Das Rezept konnte nicht gespeichert werden. Deine Eingaben bleiben erhalten.')) return;
    recipes = isEdit ? recipes.map(item => item.id === recipe.id ? recipe : item) : [recipe, ...recipes];
  } else {
    const updated = editingRecipe ? recipes.map(item => item === editingRecipe ? recipe : item) : [recipe, ...recipes];
    if (!persist(updated)) return;
  }
  resetEditor();
  clearFilters();
  renderRecipes();
  status.textContent = `„${recipe.title}“ wurde gespeichert. Klicke auf den Rezeptnamen, um es zu öffnen.`;
  form.elements.title.focus();
});

search.addEventListener('input', renderRecipes);
showLocalRecipes();
renderRecipes();

function updateAccountControls() {
  form.inert = cloudBusy || Boolean(activeUser && !cloudReady);
  recipeList.inert = form.inert;
  logout.disabled = cloudBusy;
  importLocal.disabled = cloudBusy;
  importFile.disabled = cloudBusy;
  importFile.parentElement.hidden = !cloudReady;
  retryCloud.disabled = cloudBusy;
}

async function cloudWrite(action, message, failure) {
  if (!activeUser || cloudBusy || !cloudReady) return false;
  const version = accountVersion;
  cloudBusy = true;
  updateAccountControls();
  try {
    await action(activeUser.id);
    return version === accountVersion;
  } catch {
    if (version === accountVersion) message.textContent = failure;
    return false;
  } finally {
    if (version === accountVersion) {
      cloudBusy = false;
      updateAccountControls();
    }
  }
}

async function refreshCloudRecipes() {
  if (!activeUser || cloudBusy) return;
  const version = accountVersion;
  cloudBusy = true;
  retryCloud.hidden = true;
  updateAccountControls();
  accountStatus.textContent = 'Rezepte werden geladen …';
  try {
    const loaded = await loadCloudRecipes(activeUser.id);
    if (version !== accountVersion) return;
    recipes = loaded;
    cloudReady = true;
    importLocal.hidden = readLocalRecipes().length === 0;
    accountStatus.textContent = `Angemeldet als ${activeUser.email}.`;
    renderRecipes();
  } catch {
    if (version !== accountVersion) return;
    retryCloud.hidden = false;
    accountStatus.textContent = 'Deine Konto-Rezepte konnten nicht geladen werden. Bitte versuche es erneut.';
  } finally {
    if (version === accountVersion) {
      cloudBusy = false;
      updateAccountControls();
    }
  }
}

function switchAccount(session) {
  const user = session?.user ?? null;
  loginForm.hidden = Boolean(user);
  logout.hidden = !user;
  if (activeUser?.id === user?.id) return;
  activeUser = user;
  accountVersion++;
  cloudBusy = false;
  cloudReady = false;
  importLocal.hidden = true;
  retryCloud.hidden = true;
  resetEditor();
  clearFilters();
  status.textContent = '';
  recipes = [];
  storageNote.textContent = user ? 'Deine Rezepte werden in deinem Konto gespeichert.'
    : 'Ohne Anmeldung bleiben deine Rezepte in diesem Browser. Melde dich an, um sie auf mehreren Geräten zu verwenden.';
  if (user) {
    loginForm.reset();
    setTimeout(refreshCloudRecipes, 0);
  } else {
    accountStatus.textContent = 'Du bist abgemeldet.';
    showLocalRecipes();
  }
  updateAccountControls();
  renderRecipes();
}

exportLocal.addEventListener('click', () => {
  const file = new Blob([JSON.stringify(readLocalRecipes())], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'mein-rezeptbuch.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

async function importRecipes(recipesToCopy) {
  const local = recipesToCopy.map(recipe => ({
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    servings: validServings(recipe.servings) ? recipe.servings : null,
    labels: getLabels(recipe),
    photo: typeof recipe.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(recipe.photo) ? recipe.photo : ''
  }));
  if (!local.length) {
    accountStatus.textContent = 'Die Datei enthält keine Rezepte.';
    return;
  }
  accountStatus.textContent = 'Lokale Rezepte werden kopiert …';
  if (await cloudWrite(userId => copyCloudRecipes(userId, local), accountStatus,
    'Der Import wurde unterbrochen. Du kannst ihn erneut starten. Bereits kopierte Rezepte werden nicht dupliziert.')) {
    await refreshCloudRecipes();
  }
}

if (cloud) {
  const authError = new URLSearchParams(location.hash.slice(1)).get('error_code');
  if (authError) accountStatus.textContent = 'Der Anmeldelink ist ungültig oder abgelaufen. Fordere einen neuen an.';
  cloud.auth.onAuthStateChange((_event, session) => switchAccount(session));

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginButton.disabled = true;
    accountStatus.textContent = 'Anmeldelink wird gesendet …';
    try {
      const { error } = await cloud.auth.signInWithOtp({ email: loginForm.elements.email.value.trim() });
      if (error) throw error;
      accountStatus.textContent = 'Öffne den Anmeldelink in deinem E-Mail-Postfach.';
    } catch (error) {
      accountStatus.textContent = error.code === 'email_address_not_authorized'
        ? 'Mit dem aktuellen E-Mail-Versand sind nur Adressen aus deinem Supabase-Team zugelassen.'
        : 'Der Anmeldelink konnte nicht gesendet werden. Prüfe die Adresse und versuche es später erneut.';
    } finally {
      loginButton.disabled = false;
    }
  });

  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      const { error } = await cloud.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      accountStatus.textContent = 'Abmelden fehlgeschlagen. Bitte versuche es erneut.';
    } finally {
      updateAccountControls();
    }
  });
  retryCloud.addEventListener('click', refreshCloudRecipes);
  importLocal.addEventListener('click', () => importRecipes(readLocalRecipes()));
  importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    importFile.value = '';
    if (!file) return;
    const version = accountVersion;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error('Datei zu groß');
      const saved = JSON.parse(await file.text());
      if (!isRecipeList(saved)) throw new Error('Ungültige Rezeptdaten');
      if (version === accountVersion) await importRecipes(saved);
    } catch {
      if (version === accountVersion) accountStatus.textContent = 'Bitte wähle eine gültige Rezeptbuch-Exportdatei bis 12 MB.';
    }
  });
} else {
  accountStatus.textContent = location.protocol === 'file:'
    ? 'Der Konto-Login ist in der veröffentlichten App verfügbar.'
    : 'Der Konto-Login ist gerade nicht verfügbar. Du kannst Rezepte lokal speichern.';
}
