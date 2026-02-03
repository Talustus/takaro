import { forwardRef, cloneElement, isValidElement, HTMLProps, ReactElement } from 'react';
import { usePopoverContext } from './PopoverContext';
import { useMergeRefs } from '@floating-ui/react';

export interface PopoverTriggerProps extends Omit<HTMLProps<HTMLElement>, 'children'> {
  children: ReactElement;
}

export const PopoverTrigger = forwardRef<HTMLElement, PopoverTriggerProps>(function PopoverTrigger(
  { children, ...props },
  propRef,
) {
  const context = usePopoverContext();
  const childrenRef = (children as ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (!isValidElement(children)) {
    throw new Error('Popover.Trigger requires a single React element as child');
  }

  const triggerProps = {
    ...context.getReferenceProps({
      ref,
      ...props,
      ...(children.props as object),
      onFocus: props.onFocus,
      onBlur: props.onBlur,
    }),
    'data-state': context.open ? 'open' : 'closed',
  };

  return cloneElement(children, triggerProps);
});
