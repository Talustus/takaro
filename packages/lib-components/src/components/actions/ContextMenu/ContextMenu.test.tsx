import { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/testUtils';
import { ContextMenu } from '.';

function ContextMenuWithTarget({ onItemClick }: { onItemClick?: () => void } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div data-testid="outside">Outside area</div>
      <div data-testid="target" ref={targetRef}>
        Target area
        <ContextMenu targetRef={targetRef}>
          <ContextMenu.Item label="Item 1" onClick={onItemClick} />
          <ContextMenu.Item label="Item 2" />
        </ContextMenu>
      </div>
    </div>
  );
}

function DocumentLevelContextMenu() {
  return (
    <div data-testid="document-area">
      Document area
      <ContextMenu>
        <ContextMenu.Item label="Document Item 1" />
        <ContextMenu.Item label="Document Item 2" />
      </ContextMenu>
    </div>
  );
}

describe('ContextMenu', () => {
  it('should show context menu when right-clicking on the target container', () => {
    render(<ContextMenuWithTarget />);

    const target = screen.getByTestId('target');
    fireEvent.contextMenu(target);

    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Item 2' })).toBeInTheDocument();
  });

  it('should not show context menu when right-clicking outside the target container', () => {
    render(<ContextMenuWithTarget />);

    const outside = screen.getByTestId('outside');
    fireEvent.contextMenu(outside);

    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
  });

  it('should close menu when clicking outside of it', () => {
    render(<ContextMenuWithTarget />);

    const target = screen.getByTestId('target');
    fireEvent.contextMenu(target);
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    fireEvent.pointerDown(outside);

    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
  });

  it('should close menu when pressing Escape', () => {
    render(<ContextMenuWithTarget />);

    const target = screen.getByTestId('target');
    fireEvent.contextMenu(target);
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
  });

  it('should close menu when clicking a menu item', () => {
    const onItemClick = vi.fn();
    render(<ContextMenuWithTarget onItemClick={onItemClick} />);

    const target = screen.getByTestId('target');
    fireEvent.contextMenu(target);
    expect(screen.getByRole('menuitem', { name: 'Item 1' })).toBeInTheDocument();

    const menuItem = screen.getByRole('menuitem', { name: 'Item 1' });
    fireEvent.click(menuItem);

    expect(onItemClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menuitem', { name: 'Item 1' })).not.toBeInTheDocument();
  });
});

describe('ContextMenu (document-level)', () => {
  it('should show context menu when right-clicking anywhere without targetRef', () => {
    render(<DocumentLevelContextMenu />);

    const area = screen.getByTestId('document-area');
    fireEvent.contextMenu(area);

    expect(screen.getByRole('menuitem', { name: 'Document Item 1' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Document Item 2' })).toBeInTheDocument();
  });
});
