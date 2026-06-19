<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Emoticons</h2>
      <button @click="isCreating = true" class="kokoa-btn kokoa-btn--primary">New Emoticon</button>
    </div>

    <div v-if="isCreating" class="kokoa-window" style="margin-bottom: 20px;">
      <div class="kokoa-window__titlebar">Add New Emoticon</div>
      <div class="kokoa-window__content">
        <form @submit.prevent="createEmoticon">
          <label class="kokoa-label">Name</label>
          <input v-model="form.name" type="text" class="kokoa-input" required placeholder="e.g. Heart">
          <br><br>
          <label class="kokoa-label">Image URL or Emoji</label>
          <input v-model="form.imageUrl" type="text" class="kokoa-input" required placeholder="https://... or 👍">
          <br><br>
          <div style="display: flex; gap: 10px;">
            <button type="submit" class="kokoa-btn kokoa-btn--accent">Save</button>
            <button type="button" @click="isCreating = false" class="kokoa-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <KokoaTable
      :columns="columns"
      :rows="emoticons || []"
      striped
      bordered
    >
      <template #cell-imageUrl="{ value, row }">
        <span v-if="value.length < 5" style="font-size: 24px;">{{ value }}</span>
        <img v-else :src="value" :alt="row.name" style="width: 32px; height: 32px; object-fit: cover;">
      </template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="`/dashboard/emoticons/${row.id}`" class="kokoa-btn kokoa-btn--sm" style="margin-right: 5px;">Edit</NuxtLink>
        <button @click="deleteEmoticon(row.id)" class="kokoa-btn kokoa-btn--sm">Delete</button>
      </template>
    </KokoaTable>
    <div v-if="loading" style="text-align: center; padding: 20px;">Loading more...</div>
    <div v-if="!hasMore && emoticons.length > 0" style="text-align: center; padding: 20px;">No more emoticons.</div>
  </div>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core';
const { showAlert, showConfirm } = useDialog();
definePageMeta({ layout: 'admin' });
useHead({ title: 'Emoticons - Admin' });

const emoticons = ref([]);
const page = ref(1);
const limit = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchEmoticons = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const data = await $fetch('/api/emoticons', {
      query: { page: page.value, limit }
    });
    if (data.length < limit) {
      hasMore.value = false;
    }
    emoticons.value.push(...data);
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

await fetchEmoticons();

if (import.meta.client) {
  useInfiniteScroll(
    window,
    async () => {
      await fetchEmoticons();
    },
    { distance: 100 }
  );
}

const refresh = async () => {
  emoticons.value = [];
  page.value = 1;
  hasMore.value = true;
  await fetchEmoticons();
};

const columns = [
  { key: 'imageUrl', label: 'Emoticon' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'actions', label: 'Actions' }
];

const isCreating = ref(false);
const form = ref({ name: '', imageUrl: '' });

const createEmoticon = async () => {
  try {
    await $fetch('/api/emoticons', {
      method: 'POST',
      body: form.value
    });
    isCreating.value = false;
    form.value = { name: '', imageUrl: '' };
    refresh();
  } catch (err) {
    await showAlert(err.message, 'Error');
  }
};

const deleteEmoticon = async (id) => {
  const confirmed = await showConfirm('Are you sure you want to delete this emoticon?');
  if (!confirmed) return;
  
  try {
    await $fetch(`/api/emoticons/${id}`, { method: 'DELETE' });
    await showAlert('Emoticon deleted successfully!', 'Success');
    refresh();
  } catch (err) {
    await showAlert(err.message, 'Error');
  }
};
</script>
