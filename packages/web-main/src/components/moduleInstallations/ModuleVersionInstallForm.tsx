import { zodResolver } from '@hookform/resolvers/zod';
import { SmallModuleVersionOutputDTO } from '@takaro/apiclient';
import { Button, styled, Tooltip } from '@takaro/lib-components';
import { useNavigate } from '@tanstack/react-router';
import { ModuleVersionSelectQueryField } from '../../components/selects/ModuleVersionSelectQueryField';
import { FC, useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const Wrapper = styled.div`
  div {
    margin-bottom: 0;
  }
`;

interface ModuleVersionInstallFormProps {
  moduleId: string;
  gameServerId: string;
  onVersionTagSelected?: (tag: string) => void;
  filterVersions?: (version: SmallModuleVersionOutputDTO) => boolean;
}

const validationSchema = z.object({
  tag: z.string().min(1),
});

export const ModuleVersionInstallForm: FC<ModuleVersionInstallFormProps> = ({
  moduleId,
  gameServerId,
  onVersionTagSelected,
  filterVersions,
}) => {
  const navigate = useNavigate();
  const { handleSubmit, control, watch, reset } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async ({ tag }) => {
    navigate({
      to: '/gameserver/$gameServerId/modules/$moduleId/$moduleVersionTag/install',
      params: { gameServerId, moduleId: moduleId, moduleVersionTag: tag },
    });
    reset({ tag: undefined });
  };

  const isLatestSelected = watch('tag') === 'latest';

  useEffect(() => {
    if (isLatestSelected && typeof onVersionTagSelected === 'function') {
      onVersionTagSelected('latest');
    }
  }, [isLatestSelected]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Wrapper style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
        <ModuleVersionSelectQueryField
          control={control}
          name="tag"
          label=""
          moduleId={moduleId}
          filter={filterVersions}
          returnVariant="tag"
        />
        <Tooltip disabled={!isLatestSelected}>
          <Tooltip.Trigger asChild>
            <Button color={isLatestSelected ? 'warning' : 'primary'} type="submit">
              Install
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            Installing <strong>latest</strong> is strongly discouraged as it might break your installed module. <br />
            If you are not actively developing the module, please select a tagged version to install.
          </Tooltip.Content>
        </Tooltip>
      </Wrapper>
    </form>
  );
};
