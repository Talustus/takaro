import { forwardRef, cloneElement, isValidElement, HTMLProps, useState, ReactElement, ReactNode } from 'react';
import { useDropdownContext } from './DropdownContext';
import { useMergeRefs } from '@floating-ui/react';
import { TooltipOptions } from '../../feedback/Tooltip/useTooltip';
import { Tooltip } from '../../../components';

export interface DropdownTriggerProps extends Omit<HTMLProps<HTMLElement>, 'children'> {
  children: ReactElement;
  tooltipOptions?: TooltipOptions & { content: ReactNode };
}

export const DropdownTrigger = forwardRef<HTMLElement, DropdownTriggerProps>(function DropdownTrigger(
  {
    children,
    tooltipOptions = {
      initialOpen: false,
      placement: 'top', // because dropdown will be below by default
    },
    ...props
  },
  propRef,
) {
  const context = useDropdownContext();
  const childrenRef = (children as ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  const [unControlledOpen, setUncontrolledOpen] = useState<boolean>(tooltipOptions?.initialOpen ?? false);

  const open = tooltipOptions.open ?? unControlledOpen;
  const setOpen = tooltipOptions.onOpenChange ?? setUncontrolledOpen;

  if (!isValidElement(children)) {
    throw new Error('Dropdown.Trigger requires a single React element as child');
  }

  const inner = cloneElement(
    children,
    context.getReferenceProps({
      ref,
      ...props,
      ...children.props,
      onClick(event: React.MouseEvent) {
        event.stopPropagation();
      },
    }),
  );

  if (tooltipOptions && tooltipOptions.content) {
    return (
      <Tooltip open={open} onOpenChange={setOpen} placement={tooltipOptions.placement}>
        <Tooltip.Trigger>{inner}</Tooltip.Trigger>
        <Tooltip.Content>{tooltipOptions.content}</Tooltip.Content>
      </Tooltip>
    );
  }

  return inner;
});
