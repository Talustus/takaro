import { useState } from 'react';
import { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useModuleImport } from '../../../queries/module';
import { ModuleImportForm, IFormInputs } from './-modules/ModuleImportForm';
import { hasPermission } from '../../../hooks/useHasPermission';
import { userMeQueryOptions } from '../../../queries/user';
import { DrawerSkeleton } from '@takaro/lib-components';
import { useSnackbar } from 'notistack';

export const Route = createFileRoute('/_auth/_global/modules/create/import')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(userMeQueryOptions());
    if (!hasPermission(session, ['MANAGE_MODULES'])) {
      throw redirect({ to: '/forbidden' });
    }
  },
  component: Component,
  pendingComponent: DrawerSkeleton,
});

function Component() {
  const { mutate, error: mutationError, isPending } = useModuleImport();
  const [parseError, setParseError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const onSubmit = async ({ importData, name }: IFormInputs) => {
    setParseError(null);
    const data = importData[0];
    const text = await data.text();

    try {
      const json = JSON.parse(text);
      mutate(
        { ...json, name },
        {
          onSuccess: () => {
            navigate({ to: '/modules' });
            enqueueSnackbar('Module imported!', { variant: 'default', type: 'success' });
          },
        },
      );
    } catch {
      setParseError('Invalid JSON file format. Please check the file and try again.');
    }
  };

  return <ModuleImportForm onSubmit={onSubmit} isLoading={isPending} error={parseError || mutationError} />;
}
