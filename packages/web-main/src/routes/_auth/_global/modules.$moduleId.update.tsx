import { moduleQueryOptions, useModuleUpdate } from '../../../queries/module';
import { hasPermission } from '../../../hooks/useHasPermission';
import { userMeQueryOptions } from '../../../queries/user';
import { ModuleFormBuilder } from './-modules/ModuleForm/ModuleFormBuilder';
import { canRenderInBuilder, ModuleFormSubmitProps, moduleViewValidationSchema } from './-modules/ModuleForm';
import { DrawerSkeleton } from '@takaro/lib-components';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ModuleFormManual } from './-modules/ModuleForm/ModuleFormManual';
import { useSnackbar } from 'notistack';

export const Route = createFileRoute('/_auth/_global/modules/$moduleId/update')({
  validateSearch: moduleViewValidationSchema,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(userMeQueryOptions());
    if (!hasPermission(session, ['MANAGE_MODULES'])) {
      throw redirect({ to: '/forbidden' });
    }
  },
  loader: ({ params, context }) => context.queryClient.ensureQueryData(moduleQueryOptions(params.moduleId)),
  component: Component,
  pendingComponent: DrawerSkeleton,
});

function Component() {
  const mod = Route.useLoaderData();
  const { mutate, isPending: isSubmitting, error: formError } = useModuleUpdate();
  const navigate = Route.useNavigate();
  const { view } = Route.useSearch();
  const { moduleId } = Route.useParams();
  const { enqueueSnackbar } = useSnackbar();

  if (view === 'builder') {
    if (canRenderInBuilder(mod.latestVersion.configSchema, mod.latestVersion.uiSchema) === false) {
      enqueueSnackbar('This module cannot be edited in builder mode', { type: 'error', variant: 'default' });
      navigate({
        to: '/modules/$moduleId/update',
        params: { moduleId },
        search: { view: 'manual' },
        replace: true,
      });
      // Prevent rendering while navigation is in progress
      return null;
    }
  }

  const onSubmit = (fields: ModuleFormSubmitProps) => {
    mutate(
      {
        id: mod.id,
        moduleUpdate: {
          name: fields.name,
          author: fields.author,
          supportedGames: fields.supportedGames,
          latestVersion: {
            description: fields.description,
            configSchema: fields.schema, // this is already stringified
            uiSchema: fields.uiSchema, // this is already stringified
            permissions: fields.permissions,
          },
        },
      },
      { onSuccess: () => navigate({ to: '/modules' }) },
    );
  };

  return (
    <>
      {view === 'manual' && (
        <ModuleFormManual
          moduleName={mod.name}
          moduleAuthor={mod.author}
          moduleSupportedGames={mod.supportedGames}
          moduleVersion={mod.latestVersion}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          error={formError}
        />
      )}
      {view === 'builder' && (
        <ModuleFormBuilder
          moduleName={mod.name}
          moduleAuthor={mod.author}
          moduleSupportedGames={mod.supportedGames}
          moduleVersion={mod.latestVersion}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          error={formError}
        />
      )}
    </>
  );
}
