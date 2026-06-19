<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Posts</h2>
      <button @click="isCreating = true" class="kokoa-btn kokoa-btn--primary">New Post</button>
    </div>

    <div v-if="isCreating" class="kokoa-window" style="margin-bottom: 20px;">
      <div class="kokoa-window__titlebar">Create New Post</div>
      <div class="kokoa-window__content">
        <form @submit.prevent="createPost">
          <label class="kokoa-label">Title</label>
          <input v-model="form.title" type="text" class="kokoa-input" required>
          <br><br>
          <label class="kokoa-label">Slug</label>
          <input v-model="form.slug" type="text" class="kokoa-input" required>
          <br><br>
          <label class="kokoa-label">Content (Markdown)</label>
          <textarea v-model="form.content" rows="10" class="kokoa-textarea" required></textarea>
          <br><br>
          <label class="kokoa-label">Tags</label>
          <KokoaTagSelect
            v-model="form.tags"
            :options="tagOptions"
            placeholder="Select tags..."
            style="margin-bottom: 20px;"
          />
          <br>
          <label class="kokoa-label">Reaction Mode</label>
          <select v-model="form.reactionMode" class="kokoa-input" style="margin-bottom: 10px;">
            <option value="all">All Allowed</option>
            <option value="none">All Disabled</option>
            <option value="whitelist">Whitelist</option>
            <option value="blacklist">Blacklist</option>
          </select>
          <br>
          <template v-if="form.reactionMode === 'whitelist' || form.reactionMode === 'blacklist'">
            <label class="kokoa-label">Selected Emoticons for {{ form.reactionMode }}</label>
            <KokoaTagSelect
              v-model="form.emoticonRules"
              :options="emoticonOptions"
              placeholder="Select emoticons..."
              style="margin-bottom: 20px;"
            />
          </template>
          <br>
          <div style="display: flex; gap: 10px;">
            <button type="submit" class="kokoa-btn kokoa-btn--accent">Save</button>
            <button type="button" @click="isCreating = false" class="kokoa-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <KokoaTable
      :columns="columns"
      :rows="posts || []"
      striped
      bordered
    >
      <template #cell-slug="{ value }">
        <KokoaCopyLabel :model-value="value" mode="click" />
      </template>
      <template #cell-createdAt="{ value }">
        {{ new Date(value).toLocaleDateString() }}
      </template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/dashboard/posts/${row.slug}`" class="kokoa-btn kokoa-btn--sm" style="margin-right: 5px;">Edit</NuxtLink>
        <button @click="deletePost(row.slug)" class="kokoa-btn kokoa-btn--sm">Delete</button>
      </template>
    </KokoaTable>
    <div v-if="loading" style="text-align: center; padding: 20px;">Loading more...</div>
    <div v-if="!hasMore && posts.length > 0" style="text-align: center; padding: 20px;">No more posts.</div>
  </div>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core';
const { showAlert, showConfirm } = useDialog();
definePageMeta({ layout: 'admin' });
useHead({ title: 'Posts - Admin' });

const posts = ref([]);
const page = ref(1);
const limit = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchPosts = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const data = await $fetch('/api/posts', {
      query: { page: page.value, limit }
    });
    if (data.length < limit) {
      hasMore.value = false;
    }
    posts.value.push(...data);
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

await fetchPosts();

if (import.meta.client) {
  useInfiniteScroll(
    window,
    async () => {
      await fetchPosts();
    },
    { distance: 100 }
  );
}

const refresh = async () => {
  posts.value = [];
  page.value = 1;
  hasMore.value = true;
  await fetchPosts();
};

const columns = [
  { key: 'title', label: 'Title', sortable: true, filterable: true },
  { key: 'slug', label: 'Slug', filterable: true },
  { key: 'viewsCount', label: 'Views', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions' }
];

const isCreating = ref(false);
const form = ref({ title: '', slug: '', content: '', tags: [], reactionMode: 'all', emoticonRules: [] });

const { data: tags } = await useFetch('/api/tags');
const tagOptions = computed(() => {
  return (tags.value || []).map(t => ({ id: t.id, label: t.name }));
});

const { data: emoticonsList } = await useFetch('/api/emoticons?limit=-1');
const emoticonOptions = computed(() => {
  return (emoticonsList.value || []).map(e => ({
    id: e.id,
    label: e.name,
    image: e.imageUrl.length >= 5 ? e.imageUrl : undefined
  }));
});

watch(() => form.value.title, (newTitle) => {
  if (isCreating.value) {
    form.value.slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
});

const createPost = async () => {
  try {
    await $fetch('/api/posts', {
      method: 'POST',
      body: form.value
    });
    isCreating.value = false;
    form.value = { title: '', slug: '', content: '', tags: [], reactionMode: 'all', emoticonRules: [] };
    refresh();
  } catch (err) {
    await showAlert(err.message, 'Error');
  }
};

const deletePost = async (slug) => {
  if (!(await showConfirm('Are you sure you want to delete this post?', 'Confirm Delete'))) return;
  try {
    await $fetch(`/api/posts/${slug}`, { method: 'DELETE' });
    refresh();
  } catch (err) {
    await showAlert(err.message, 'Error');
  }
};
</script>
