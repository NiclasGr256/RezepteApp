// Navigation und Dialoge: Das Formular bleibt beim Schließen als Entwurf erhalten.
const menuDialog = document.querySelector('#menu-dialog');
const editorDialog = document.querySelector('#editor-dialog');
const cookingDialog = document.querySelector('#cooking-dialog');
const menuToggle = document.querySelector('#menu-toggle');
let restoreCookingContent = null;

function openRecipeEditor() {
  if (menuDialog.open) menuDialog.close();
  if (!editorDialog.open) editorDialog.showModal();
}

function closeRecipeEditor() {
  if (editorDialog.open) editorDialog.close();
  document.querySelector('#new-recipe').focus();
}

function startNewRecipe() {
  const hasDraft = editingRecipe || currentPhoto || saveButton.disabled ||
    [...labelInputs.values()].some(input => input.checked) ||
    form.elements.servings.value !== form.elements.servings.defaultValue ||
    [form.elements.title, form.elements.ingredients, form.elements.instructions].some(input => input.value.trim());
  if (hasDraft && !window.confirm('Aktuelle Eingaben verwerfen und ein neues Rezept beginnen?')) return;
  resetEditor();
  openRecipeEditor();
  form.elements.title.focus();
}

function openCookingView(title, content, trigger) {
  document.querySelector('#cooking-title').textContent = title;
  const placeholder = document.createComment('Rezeptinhalt in der Kochansicht');
  content.replaceWith(placeholder);
  document.querySelector('#cooking-content').append(content);
  restoreCookingContent = () => {
    placeholder.replaceWith(content);
    if (trigger.isConnected) trigger.focus();
  };
  cookingDialog.showModal();
}

document.querySelector('#new-recipe').addEventListener('click', startNewRecipe);
document.querySelector('#menu-new-recipe').addEventListener('click', startNewRecipe);
menuToggle.addEventListener('click', () => {
  menuDialog.showModal();
  menuToggle.setAttribute('aria-expanded', 'true');
});
menuDialog.addEventListener('close', () => menuToggle.setAttribute('aria-expanded', 'false'));
document.querySelector('#show-recipes').addEventListener('click', () => {
  menuDialog.close();
  search.focus();
});
document.querySelector('#clear-active-filters').addEventListener('click', () => {
  clearFilters();
  renderRecipes();
  search.focus();
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
cookingDialog.addEventListener('close', () => {
  restoreCookingContent?.();
  restoreCookingContent = null;
});
cancelEdit.addEventListener('click', closeRecipeEditor);
