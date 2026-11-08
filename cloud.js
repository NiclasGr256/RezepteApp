// Der Publishable Key ist für Browser vorgesehen. Zugriffsrechte erzwingt Postgres.
const cloud = window.supabase && location.protocol === 'https:'
  ? window.supabase.createClient('https://toqdzgxitihqxywwyoqd.supabase.co', 'sb_publishable_W681rZjSREDHEFZUm6ieRg_RuKV2EJy', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  : null;

const cloudFields = 'id,title,ingredients,instructions,servings,labels,photo';

async function loadCloudRecipes() {
  const pageSize = 25;
  const result = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await cloud.from('shared_recipes').select(cloudFields)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    result.push(...data);
    if (data.length < pageSize) return result;
  }
}

async function saveCloudRecipe(recipe, isEdit) {
  const query = isEdit
    ? cloud.from('shared_recipes').update(recipe).eq('id', recipe.id)
    : cloud.from('shared_recipes').upsert(recipe);
  const { error } = await query.select('id').single();
  if (error) throw error;
}

async function deleteCloudRecipe(id) {
  const { error } = await cloud.from('shared_recipes').delete().eq('id', id);
  if (error) throw error;
}

async function copyCloudRecipes(local) {
  // Stabile IDs machen erneute Importe und Wiederholungen nach einem Abbruch sicher.
  const copies = new Map();
  for (const recipe of [...local].reverse()) {
    const key = JSON.stringify(recipe);
    const occurrence = (copies.get(key) ?? 0) + 1;
    copies.set(key, occurrence);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${occurrence}:${key}`));
    const hex = Array.from(new Uint8Array(digest).slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
    const { error } = await cloud.from('shared_recipes').upsert({ ...recipe, id }, { ignoreDuplicates: true });
    if (error) throw error;
  }
}
