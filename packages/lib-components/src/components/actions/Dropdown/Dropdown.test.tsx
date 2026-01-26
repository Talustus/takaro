import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/testUtils';
import { Dropdown } from '.';

describe('Dropdown', () => {
  it('should show menu when clicking the trigger', () => {
    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open menu</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Item label="Item 1" onClick={() => {}} />
          <Dropdown.Menu.Item label="Item 2" onClick={() => {}} />
        </Dropdown.Menu>
      </Dropdown>,
    );

    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Item 2' })).toBeInTheDocument();
  });

  it('should close menu when clicking outside', async () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <Dropdown>
          <Dropdown.Trigger>
            <button>Open menu</button>
          </Dropdown.Trigger>
          <Dropdown.Menu>
            <Dropdown.Menu.Item label="Item 1" onClick={() => {}} />
          </Dropdown.Menu>
        </Dropdown>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
    });
  });

  it('should close menu when pressing Escape', async () => {
    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open menu</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Item label="Item 1" onClick={() => {}} />
        </Dropdown.Menu>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
    });
  });

  it('should call onClick and close menu when clicking a menu item', async () => {
    const onClick = vi.fn();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open menu</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Item label="Item 1" onClick={onClick} />
        </Dropdown.Menu>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Item 1' }));

    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
    });
  });

  it('should not call onClick when clicking a disabled menu item', () => {
    const onClick = vi.fn();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open menu</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Item label="Disabled item" onClick={onClick} disabled />
        </Dropdown.Menu>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disabled item' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should support controlled mode', () => {
    function ControlledDropdown() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>External open</button>
          <Dropdown open={open} onOpenChange={setOpen}>
            <Dropdown.Trigger>
              <button>Trigger</button>
            </Dropdown.Trigger>
            <Dropdown.Menu>
              <Dropdown.Menu.Item label="Item 1" onClick={() => {}} />
            </Dropdown.Menu>
          </Dropdown>
        </>
      );
    }

    render(<ControlledDropdown />);

    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();

    // Internal trigger click does nothing in controlled mode
    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();

    // External control opens the dropdown
    fireEvent.click(screen.getByRole('button', { name: 'External open' }));
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();
  });

  it('should toggle open/closed when clicking trigger', async () => {
    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open menu</button>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Item label="Item 1" onClick={() => {}} />
        </Dropdown.Menu>
      </Dropdown>,
    );

    const trigger = screen.getByRole('button', { name: 'Open menu' });

    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
    });
  });
});
