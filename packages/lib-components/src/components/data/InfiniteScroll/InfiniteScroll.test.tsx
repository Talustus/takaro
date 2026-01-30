import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/testUtils';
import { InfiniteScroll } from '.';

// Mock react-intersection-observer
const mockInView = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: vi.fn(),
    inView: mockInView(),
  }),
}));

describe('InfiniteScroll', () => {
  beforeEach(() => {
    mockInView.mockReturnValue(false);
  });

  it('should show "Load more" button when hasNextPage is true and not fetching', () => {
    const fetchNextPage = vi.fn();

    render(
      <InfiniteScroll hasNextPage={true} isFetching={false} isFetchingNextPage={false} fetchNextPage={fetchNextPage} />,
    );

    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
  });

  it('should show Spinner when isFetchingNextPage is true', () => {
    const fetchNextPage = vi.fn();

    render(
      <InfiniteScroll hasNextPage={true} isFetching={false} isFetchingNextPage={true} fetchNextPage={fetchNextPage} />,
    );

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('should call fetchNextPage when clicking "Load more" button', () => {
    const fetchNextPage = vi.fn();

    render(
      <InfiniteScroll hasNextPage={true} isFetching={false} isFetchingNextPage={false} fetchNextPage={fetchNextPage} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it('should not render anything when hasNextPage is false', () => {
    const fetchNextPage = vi.fn();

    const { container } = render(
      <InfiniteScroll
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        fetchNextPage={fetchNextPage}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="spinner"]')).not.toBeInTheDocument();
  });

  it('should not show "Load more" button when isFetching is true', () => {
    const fetchNextPage = vi.fn();

    render(
      <InfiniteScroll hasNextPage={true} isFetching={true} isFetchingNextPage={false} fetchNextPage={fetchNextPage} />,
    );

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('should call fetchNextPage when element comes into view', () => {
    const fetchNextPage = vi.fn();
    mockInView.mockReturnValue(true);

    render(
      <InfiniteScroll hasNextPage={true} isFetching={false} isFetchingNextPage={false} fetchNextPage={fetchNextPage} />,
    );

    expect(fetchNextPage).toHaveBeenCalledOnce();
  });
});
