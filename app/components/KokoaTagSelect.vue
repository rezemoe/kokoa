<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

export interface TagOption {
  id: string
  label: string
  image?: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: TagOption[]
  placeholder?: string
  maxTags?: number
}>(), {
  placeholder: 'Search tags…',
  maxTags: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const focusedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const selectedSet = computed(() => new Set(props.modelValue))

const filteredOptions = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return props.options.filter(opt => {
    if (q && !opt.label.toLowerCase().includes(q) && !(opt.description?.toLowerCase().includes(q))) {
      return false
    }
    return true
  })
})

const isMaxReached = computed(() => props.maxTags > 0 && props.modelValue.length >= props.maxTags)

const { list, containerProps, wrapperProps } = useVirtualList(
  filteredOptions,
  {
    itemHeight: 32,
    overscan: 10
  }
)

function getOption(id: string) {
  return props.options.find(o => o.id === id)
}

function selectTag(opt: TagOption) {
  if (opt.disabled || selectedSet.value.has(opt.id)) {
    if (selectedSet.value.has(opt.id)) {
      removeTag(opt.id)
    }
    return
  }
  if (isMaxReached.value) return
  emit('update:modelValue', [...props.modelValue, opt.id])
  searchQuery.value = ''
  focusedIndex.value = -1
}

function removeTag(id: string) {
  emit('update:modelValue', props.modelValue.filter(v => v !== id))
}

function openDropdown() {
  if (!isOpen.value) {
    isOpen.value = true
    focusedIndex.value = -1
  }
}

function onInputFocus() {
  openDropdown()
}

function onInputBlur() {
  setTimeout(() => {
    isOpen.value = false
    focusedIndex.value = -1
  }, 150)
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    openDropdown()
    e.preventDefault()
    return
  }

  if (!isOpen.value) return

  const opts = filteredOptions.value

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, opts.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < opts.length) {
        selectTag(opts[focusedIndex.value])
      }
      break
    case 'Escape':
      isOpen.value = false
      focusedIndex.value = -1
      break
    case 'Backspace':
      if (!searchQuery.value && props.modelValue.length > 0) {
        removeTag(props.modelValue[props.modelValue.length - 1])
      }
      break
  }
}
</script>

<template>
  <div ref="containerRef" class="kokoa-tag-select">
    <div class="kokoa-tag-select__display" @click="inputRef?.focus()">
      <span
        v-for="tagId in modelValue"
        :key="tagId"
        class="kokoa-tag-select__tag"
      >
        <img
          v-if="getOption(tagId)?.image"
          :src="getOption(tagId)!.image"
          :alt="getOption(tagId)!.label"
          class="kokoa-tag-select__tag-img"
        />
        {{ getOption(tagId)?.label ?? tagId }}
        <button
          type="button"
          class="kokoa-tag-select__tag-remove"
          @click.stop="removeTag(tagId)"
          @mousedown.prevent
        >✕</button>
      </span>

      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        class="kokoa-tag-select__input"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        :disabled="isMaxReached"
        @focus="onInputFocus"
        @blur="onInputBlur"
        @keydown="onKeydown"
      />
    </div>

    <div v-if="isOpen" class="kokoa-tag-select__dropdown" v-bind="containerProps" style="max-height: 200px; overflow-y: auto;">
      <div v-bind="wrapperProps">
        <button
          v-for="{ data: opt, index: idx } in list"
          :key="opt.id"
          type="button"
          class="kokoa-tag-select__option"
          :class="{
            'kokoa-tag-select__option--focused': idx === focusedIndex,
            'kokoa-tag-select__option--selected': selectedSet.has(opt.id),
            'kokoa-tag-select__option--disabled': opt.disabled,
          }"
        @mousedown.prevent
        @click="selectTag(opt)"
        @mouseenter="focusedIndex = idx"
      >

          <img
            v-if="opt.image"
            :src="opt.image"
            :alt="opt.label"
            class="kokoa-tag-select__option-img"
          />
          <span class="kokoa-tag-select__option-text">
            <span class="kokoa-tag-select__option-label">{{ opt.label }}</span>
            <span v-if="opt.description" class="kokoa-tag-select__option-desc">{{ opt.description }}</span>
          </span>
        </button>
      </div>
      <div v-if="filteredOptions.length === 0" class="kokoa-tag-select__empty">
        No matches ε(´∀｀)з
      </div>
    </div>
  </div>
</template>
