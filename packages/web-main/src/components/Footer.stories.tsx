import { Meta, StoryFn } from '@storybook/react-vite';
import { Footer } from './Footer';

export default {
  title: 'Footer',
  component: Footer,
} as Meta;

export const Default: StoryFn = () => {
  return <Footer />;
};
