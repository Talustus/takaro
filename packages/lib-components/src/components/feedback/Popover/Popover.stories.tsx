import React from 'react';
import { Meta, StoryFn } from '@storybook/react-vite';
import { Popover, PopoverProps } from '../Popover';
import { IconButton } from '../../actions/IconButton';
import { AiFillBug as BugIcon } from 'react-icons/ai';

export default {
  title: 'Feedback/Popover',
  component: Popover,
  args: {
    placement: 'bottom',
  },
} as Meta<PopoverProps>;

export const Default: StoryFn<PopoverProps> = () => (
  <Popover>
    <Popover.Trigger>
      <button>Click this to open the popover</button>
    </Popover.Trigger>
    <Popover.Content>This is the content of the popover</Popover.Content>
  </Popover>
);

export const WithIconButton: StoryFn<PopoverProps> = () => (
  <Popover>
    <Popover.Trigger>
      <IconButton icon={<BugIcon />} ariaLabel="click me" />
    </Popover.Trigger>
    <Popover.Content>This is the content of the popover</Popover.Content>
  </Popover>
);
