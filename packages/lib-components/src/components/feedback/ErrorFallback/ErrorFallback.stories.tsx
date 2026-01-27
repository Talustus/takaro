import React from 'react';
import { Meta, StoryFn } from '@storybook/react-vite';
import { ErrorFallback } from '.';

export default {
  title: 'Feedback/ErrorFallback',
  component: ErrorFallback,
} as Meta;

export const Default: StoryFn = () => <ErrorFallback />;
