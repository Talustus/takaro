import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasPermission } from '../../../hooks/useHasPermission';
import { CategoryForm, FormFields } from '../../../components/shop/CategoryForm';
import { useShopCategoryCreate } from '../../../queries/shopCategories';
import { SubmitHandler } from 'react-hook-form';

export const Route = createFileRoute('/_auth/gameserver/$gameServerId/shop/categories/create')({
  beforeLoad: async ({ context }) => {
    const session = await context.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }

    const hasManagePermission = hasPermission(session, ['MANAGE_SHOP_LISTINGS']);
    if (!hasManagePermission) {
      throw redirect({ to: '/forbidden' });
    }
  },
  component: Component,
});

function Component() {
  const { gameServerId } = Route.useParams();
  const { mutate: createCategory, isPending, error } = useShopCategoryCreate();
  const navigate = Route.useNavigate();

  const onSubmit: SubmitHandler<FormFields> = (data) => {
    createCategory(
      {
        name: data.name,
        emoji: data.emoji,
        parentId: data.parentId ?? undefined,
      },
      {
        onSuccess: () =>
          navigate({
            to: '/gameserver/$gameServerId/shop/categories',
            params: { gameServerId },
          }),
      },
    );
  };

  return <CategoryForm gameServerId={gameServerId} onSubmit={onSubmit} isPending={isPending} error={error} />;
}
