import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react-vite';
import { Tooltip, TooltipProps } from '../Tooltip';
import { Button } from '../../actions/Button';
import { IconButton } from '../../actions/IconButton';
import { AiOutlineWoman as Icon } from 'react-icons/ai';

interface ExtraTooltipStoryProps {
  label: string;
}

export default {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  args: {
    placement: 'bottom',
    label: 'this is the tooltip content',
  },
} as Meta<TooltipProps & ExtraTooltipStoryProps>;

export const Default: StoryFn<TooltipProps & ExtraTooltipStoryProps> = (args) => (
  <Tooltip placement={args.placement}>
    <Tooltip.Trigger>
      <span>trigger</span>
    </Tooltip.Trigger>
    <Tooltip.Content>{args.label}</Tooltip.Content>
  </Tooltip>
);

export const WithIconButton: StoryFn<TooltipProps & ExtraTooltipStoryProps> = (args) => (
  <Tooltip>
    <Tooltip.Trigger>
      <IconButton icon={<Icon />} ariaLabel="aria label here" />
    </Tooltip.Trigger>
    <Tooltip.Content>{args.label}</Tooltip.Content>
  </Tooltip>
);

export const Controlled: StoryFn<TooltipProps & ExtraTooltipStoryProps> = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Tooltip open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger>
          <span>I am the trigger</span>
        </Tooltip.Trigger>
        <Tooltip.Content>controlled tooltip</Tooltip.Content>
      </Tooltip>
      <Button onClick={() => setOpen(true)}>open tooltip</Button>
    </>
  );
};
