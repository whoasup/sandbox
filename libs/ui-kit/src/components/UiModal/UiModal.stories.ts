import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UiButton from '../UiButton/UiButton.vue';
import UiInput from '../UiInput/UiInput.vue';
import UiText from '../UiText/UiText.vue';
import UiModal from './UiModal.vue';

const meta: Meta<typeof UiModal> = {
  title: 'Components/Modal',
  component: UiModal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'full'] },
    closeOnOverlay: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
  },
  args: {
    title: 'Scene settings',
    description: 'Tweak the parameters of the running TresJS scene.',
    size: 'md',
    closeOnOverlay: true,
    closeOnEscape: true,
    hideCloseButton: false,
  },
  render: (args) => ({
    components: { UiModal, UiButton, UiText },
    setup() {
      const isOpen = ref(false);
      return { args, isOpen };
    },
    template: `
      <div>
        <UiButton @click="isOpen = true">Open modal</UiButton>
        <UiModal v-bind="args" v-model="isOpen">
          <UiText tone="muted">
            The modal traps focus, locks body scrolling and restores focus to the trigger on close.
          </UiText>
          <template #footer>
            <UiButton variant="ghost" @click="isOpen = false">Cancel</UiButton>
            <UiButton @click="isOpen = false">Apply</UiButton>
          </template>
        </UiModal>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OpenByDefault: Story = {
  render: (args) => ({
    components: { UiModal, UiButton, UiText },
    setup() {
      const isOpen = ref(true);
      return { args, isOpen };
    },
    template: `
      <div>
        <UiButton @click="isOpen = true">Reopen modal</UiButton>
        <UiModal v-bind="args" v-model="isOpen">
          <UiText tone="muted">Rendered open so the layout is visible in docs and snapshots.</UiText>
          <template #footer>
            <UiButton variant="ghost" @click="isOpen = false">Close</UiButton>
          </template>
        </UiModal>
      </div>
    `,
  }),
};

export const WithForm: Story = {
  render: () => ({
    components: { UiModal, UiButton, UiInput },
    setup() {
      const isOpen = ref(false);
      const name = ref('rotating-cube');
      return { isOpen, name };
    },
    template: `
      <div>
        <UiButton variant="secondary" @click="isOpen = true">Rename scene</UiButton>
        <UiModal v-model="isOpen" title="Rename scene" size="sm">
          <UiInput v-model="name" label="Scene name" hint="Letters, digits and dashes." />
          <template #footer>
            <UiButton variant="ghost" @click="isOpen = false">Cancel</UiButton>
            <UiButton @click="isOpen = false">Save</UiButton>
          </template>
        </UiModal>
      </div>
    `,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { UiModal, UiButton, UiText },
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <div>
        <UiButton variant="danger" @click="isOpen = true">Delete scene</UiButton>
        <UiModal v-model="isOpen" title="Delete scene?" size="sm">
          <UiText tone="muted">This action cannot be undone.</UiText>
          <template #footer>
            <UiButton variant="ghost" @click="isOpen = false">Cancel</UiButton>
            <UiButton variant="danger" @click="isOpen = false">Delete</UiButton>
          </template>
        </UiModal>
      </div>
    `,
  }),
};
