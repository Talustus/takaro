import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../../test/testUtils';
import { Popover } from '.';

describe('Popover', () => {
  it('should show content when clicking the trigger', () => {
    render(
      <Popover>
        <Popover.Trigger>
          <button>Open popover</button>
        </Popover.Trigger>
        <Popover.Content>Popover content</Popover.Content>
      </Popover>,
    );

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));

    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('should close when clicking outside', () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <Popover>
          <Popover.Trigger>
            <button>Open popover</button>
          </Popover.Trigger>
          <Popover.Content>Popover content</Popover.Content>
        </Popover>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId('outside'));

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('should close when pressing Escape', () => {
    render(
      <Popover>
        <Popover.Trigger>
          <button>Open popover</button>
        </Popover.Trigger>
        <Popover.Content>Popover content</Popover.Content>
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('should support controlled mode', () => {
    function ControlledPopover() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>External open</button>
          <Popover open={open} onOpenChange={setOpen}>
            <Popover.Trigger>
              <button>Trigger</button>
            </Popover.Trigger>
            <Popover.Content>Popover content</Popover.Content>
          </Popover>
        </>
      );
    }

    render(<ControlledPopover />);

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    // Internal trigger click does nothing in controlled mode
    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    // External control opens the popover
    fireEvent.click(screen.getByRole('button', { name: 'External open' }));
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('should show content initially when initialOpen is true', () => {
    render(
      <Popover initialOpen>
        <Popover.Trigger>
          <button>Open popover</button>
        </Popover.Trigger>
        <Popover.Content>Popover content</Popover.Content>
      </Popover>,
    );

    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('should toggle open/closed when clicking trigger', () => {
    render(
      <Popover>
        <Popover.Trigger>
          <button>Open popover</button>
        </Popover.Trigger>
        <Popover.Content>Popover content</Popover.Content>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'Open popover' });

    fireEvent.click(trigger);
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });
});
