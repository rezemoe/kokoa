<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Edit Post</h2>
      <NuxtLink to="/dashboard/posts" class="kokoa-btn">Back to Posts</NuxtLink>
    </div>

    <div class="kokoa-window">
      <div class="kokoa-window__titlebar">Edit Post: {{ post?.title }}</div>
      <div class="kokoa-window__content">
        <form @submit.prevent="updatePost" v-if="post">
          <label class="kokoa-label">Title</label>
          <input v-model="form.title" type="text" class="kokoa-input" required>
          <br><br>
          <label class="kokoa-label">Content (Markdown)</label>
          <textarea v-model="form.content" rows="15" class="kokoa-textarea" required></textarea>
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
          <button type="submit" class="kokoa-btn kokoa-btn--accent">Save Changes</button>
        </form>
        <div v-else>Loading...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { showAlert } = useDialog();
definePageMeta({ layout: 'admin' });
const route = useRoute();
const slug = route.params.slug;

const { data: post } = await useFetch(`/api/posts/${slug}`);

useHead({ title: `Edit Post: ${post.value?.title || slug}` });

const form = ref({ title: '', content: '', tags: [], reactionMode: 'all', emoticonRules: [] });

const { data: tagsList } = await useFetch('/api/tags');
const tagOptions = computed(() => {
  return (tagsList.value || []).map(t => ({ id: t.id, label: t.name }));
});

const { data: emoticonsList } = await useFetch('/api/emoticons?limit=-1');
const emoticonOptions = computed(() => {
  return (emoticonsList.value || []).map(e => ({
    id: e.id,
    label: e.name,
    image: e.imageUrl.length >= 5 ? e.imageUrl : undefined
  }));
});

watch(post, (newPost) => {
  if (newPost) {
    form.value.title = newPost.title;
    form.value.content = newPost.content;
    form.value.tags = (newPost.tags || []).map(t => t.id);
    form.value.reactionMode = newPost.reactionMode || 'all';
    form.value.emoticonRules = newPost.emoticonRules || [];
  }
}, { immediate: true });

const updatePost = async () => {
  try {
    await $fetch(`/api/posts/${slug}`, {
      method: 'PUT',
      body: form.value
    });
    await showAlert('Post updated successfully!', 'Success');
    navigateTo('/dashboard/posts');
  } catch (err) {
    await showAlert(err.message, 'Error');
  }
};
</script>
