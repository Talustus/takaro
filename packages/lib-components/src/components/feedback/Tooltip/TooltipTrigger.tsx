import { forwardRef, isValidElement, cloneElement, HTMLProps, ReactElement } from 'react';
import { useTooltipContext } from './TooltipContext';
import { useMergeRefs } from '@floating-ui/react';

export interface TooltipTriggerProps extends Omit<HTMLProps<HTMLElement>, 'children'> {
  children: ReactElement;
}

export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { children, ...props },
  propRef,
) {
  const context = useTooltipContext();
  const childrenRef = (children as ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (!isValidElement(children)) {
    throw new Error('Tooltip.Trigger requires a single React element as child');
  }

  const triggerProps = {
    ...context.getReferenceProps({
      ...props,
      ...(children.props as object),
      ref,
    }),
    'data-state': context.open ? 'open' : 'closed',
  };

  return cloneElement(children, triggerProps);
});
